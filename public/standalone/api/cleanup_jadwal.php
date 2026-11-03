<?php
/* =====================================================================
   SIPELOK — Cleanup Jadwal Duplikat
   ---------------------------------------------------------------------
   Endpoint untuk membersihkan jadwal duplikat dari database.
   Hanya perlu dipanggil sekali untuk membersihkan data lama.
   ===================================================================== */
require __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: POST, OPTIONS');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') { 
    http_response_code(204); 
    exit; 
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

try {
    $db = new PDO(
        'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
        DB_USER, DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
    );
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Koneksi MySQL gagal: ' . $e->getMessage()]);
    exit;
}

try {
    error_log("SIPELOK Cleanup: Starting duplicate cleanup");
    
    // Hitung total baris sebelum cleanup
    $totalBefore = $db->query('SELECT COUNT(*) FROM jadwal')->fetchColumn();
    error_log("SIPELOK Cleanup: Total rows before: $totalBefore");
    
    // Cari dan hapus duplikat berdasarkan (tanggal, shift, urutan)
    // Simpan yang pertama (MIN id), hapus yang lain
    $deleteQuery = '
        DELETE j1 FROM jadwal j1
        INNER JOIN (
            SELECT tanggal, shift, urutan, MIN(id) as min_id
            FROM jadwal
            GROUP BY tanggal, shift, urutan
            HAVING COUNT(*) > 1
        ) j2 ON j1.tanggal = j2.tanggal 
            AND j1.shift = j2.shift 
            AND j1.urutan = j2.urutan 
            AND j1.id != j2.min_id
    ';
    
    $stmt = $db->prepare($deleteQuery);
    $stmt->execute();
    $deleted = $stmt->rowCount();
    
    error_log("SIPELOK Cleanup: Deleted $deleted duplicate rows");
    
    // Hitung total baris setelah cleanup
    $totalAfter = $db->query('SELECT COUNT(*) FROM jadwal')->fetchColumn();
    error_log("SIPELOK Cleanup: Total rows after: $totalAfter");
    
    // Juga bersihkan duplikat berdasarkan ID (jika ada)
    $deleteIdQuery = '
        DELETE j1 FROM jadwal j1
        INNER JOIN (
            SELECT id, MIN(ROW_NUMBER() OVER (ORDER BY id)) as rn
            FROM jadwal
            GROUP BY id
            HAVING COUNT(*) > 1
        ) j2 ON j1.id = j2.id AND j2.rn > 1
    ';
    
    try {
        $stmt2 = $db->prepare($deleteIdQuery);
        $stmt2->execute();
        $deletedById = $stmt2->rowCount();
        error_log("SIPELOK Cleanup: Deleted $deletedById duplicate ID rows");
    } catch (Exception $e) {
        error_log("SIPELOK Cleanup: No duplicate IDs found or error: " . $e->getMessage());
        $deletedById = 0;
    }
    
    echo json_encode([
        'ok' => true,
        'total' => $totalBefore,
        'deleted' => $deleted + $deletedById,
        'remaining' => $totalAfter,
        'message' => "Berhasil membersihkan $deleted duplikat (tanggal,shift,urutan) dan $deletedById duplikat (id)"
    ]);
    
    error_log("SIPELOK Cleanup: Complete");
    
} catch (Exception $e) {
    error_log("SIPELOK Cleanup Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}
