import { Question, GradeLevel } from '../types/assessment';

export const QUESTIONS: Question[] = [
  // =========================================================================
  // KELAS 10 SMA (FASE E KURIKULUM MERDEKA) - BAHASA INDONESIA (7 Soal)
  // 4 Soal Reguler Kurikulum Merdeka + 3 Soal Model TKA SMA Terbaru
  // =========================================================================
  {
    id: 'sma10-bind-1',
    grade: '10 SMA',
    subject: 'Bahasa Indonesia',
    questionFormat: 'Reguler Kurikulum Merdeka',
    topic: 'Teks Laporan Hasil Observasi (LHO)',
    cognitiveLevel: 'Pemahaman',
    type: 'single_choice',
    stimulusTitle: 'Ekosistem Mangrove di Pesisir Utara Jawa',
    stimulusType: 'text',
    stimulusContent:
      '(1) Mangrove adalah vegetasi pantai tropis dan subtropis yang tumbuh subur di daerah pasang surut berlumpur. (2) Akar napas pada pohon mangrove berfungsi menahan abrasi gelombang laut sekaligus menyaring sedimen dari daratan. (3) Berdasarkan pengamatan lapangan selama tiga hari, lebar sabuk hijau mangrove di Desa Pantai Makmur rata-rata mencapai 45 meter. (4) Hutan mangrove juga menjadi habitat pemijahan berbagai jenis udang dan ikan kakap.',
    questionText: 'Kalimat definisi dalam kutipan Teks Laporan Hasil Observasi di atas ditunjukkan oleh kalimat nomor...',
    options: [
      { id: 'A', text: 'Kalimat (2)' },
      { id: 'B', text: 'Kalimat (1)' },
      { id: 'C', text: 'Kalimat (3)' },
      { id: 'D', text: 'Kalimat (4)' },
      { id: 'E', text: 'Seluruh kalimat (2), (3), dan (4)' }
    ],
    correctAnswer: 'B',
    explanation:
      'Kalimat definisi ditandai dengan penggunaan verba relasional (seperti adalah, merupakan, ialah) untuk menjelaskan pengertian umum objek. Kalimat (1) menggunakan kata "adalah" untuk mendefinisikan mangrove, sehingga merupakan bagian pernyataan umum/definisi.',
    keyTakeaway: 'Dalam struktur Teks LHO Kurikulum Merdeka Fase E, kalimat definisi menggunakan kopula seperti "adalah", "ialah", atau "merupakan".'
  },
  {
    id: 'sma10-bind-2',
    grade: '10 SMA',
    subject: 'Bahasa Indonesia',
    questionFormat: 'Reguler Kurikulum Merdeka',
    topic: 'Teks Anekdot & Kritik Sosial',
    cognitiveLevel: 'Penerapan',
    type: 'single_choice',
    stimulusTitle: 'Aplikasi Antrean Tanpa Sinyal',
    stimulusType: 'dialogue',
    stimulusContent:
      'Dira mengantre sejak pukul 06.30 di kantor pelayanan administrasi kota. Saat loket dibuka pukul 08.00, petugas berkata, "Maaf Dek, sekarang antreannya serba digital lewat aplikasi, tidak perlu antre fisik." Dira mengangguk senang lalu membuka aplikasinya. Lima menit kemudian muncul notifikasi: "Server sedang penuh, silakan datang ke loket manual untuk verifikasi nomor antrean." Petugas pun menatap Dira sambil tersenyum canggung dan berkata, "Nah, silakan ambil kertas antreannya di kotak sebelah."',
    questionText: 'Makna tersirat atau kritik sosial yang paling tepat disampaikan melalui teks anekdot tersebut adalah...',
    options: [
      { id: 'A', text: 'Masyarakat kurang terbiasa menggunakan ponsel pintar untuk mengurus dokumen.' },
      { id: 'B', text: 'Pelayanan publik seharusnya hanya dibuka secara luring agar tidak membebani server.' },
      { id: 'C', text: 'Digitalisasi layanan publik sering kali belum diimbangi kesiapan infrastruktur sehingga tetap merepotkan warga.' },
      { id: 'D', text: 'Petugas loket wajib menyediakan jaringan Wi-Fi gratis bagi setiap pemohon layanan.' },
      { id: 'E', text: 'Warga seharusnya membawa formulir cetak dari rumah sebelum memindai kode QR.' }
    ],
    correctAnswer: 'C',
    explanation:
      'Teks anekdot memunculkan kelucuan/ironi ketika warga yang sudah diminta memakai aplikasi digital justru diarahkan kembali mengambil kertas antrean manual karena server bermasalah. Sindirannya mengarah pada ketidaksiapan infrastruktur digitalisasi layanan.',
    keyTakeaway: 'Anekdot menyampaikan kritik sosial secara halus melalui peristiwa ironis atau kontradiktif.'
  },
  {
    id: 'sma10-bind-3',
    grade: '10 SMA',
    subject: 'Bahasa Indonesia',
    questionFormat: 'Reguler Kurikulum Merdeka',
    topic: 'Hikayat dan Nilai Kehidupan',
    cognitiveLevel: 'Pemahaman',
    type: 'single_choice',
    stimulusTitle: 'Kutipan Hikayat Indera Bangsawan',
    stimulusType: 'text',
    stimulusContent:
      'Maka tersebutlah perkataan Syah Peri yang berjalan masuk ke dalam hutan belantara tujuh hari tujuh malam lamanya. Tiada ia gentar menghadapi mara bahaya, melainkan senantiasa memohon perlindungan kepada Tuhan Yang Mahakuasa serta berbagi bekal terakhirnya kepada seekor burung rajawali yang terluka sayapnya. Oleh sebab budi pekertinya yang luhur, burung itu pun kelak menolongnya keluar dari lembah berbatu.',
    questionText: 'Nilai moral yang paling menonjol dalam kutipan hikayat tersebut adalah...',
    options: [
      { id: 'A', text: 'Ketulusan menolong sesama makhluk hidup tanpa pamrih akan berbuah kebaikan.' },
      { id: 'B', text: 'Keinginan menjadi raja harus diperjuangkan dengan menaklukkan hutan.' },
      { id: 'C', text: 'Kekuatan fisik lebih utama daripada doa saat menghadapi bahaya.' },
      { id: 'D', text: 'Kehidupan istana jauh lebih nyaman daripada pengembaraan di alam liar.' },
      { id: 'E', text: 'Perjalanan jauh sebaiknya dihindari oleh para bangsawan istana.' }
    ],
    correctAnswer: 'A',
    explanation:
      'Tindakan Syah Peri yang mau berbagi bekal terakhirnya kepada burung rajawali yang terluka menunjukkan kepedulian dan ketulusan hati (nilai moral) yang akhirnya mendatangkan pertolongan balik.',
    keyTakeaway: 'Pengkajian hikayat pada Kurikulum Merdeka Fase E menekankan identifikasi karakteristik klasik dan relevansi nilai moral dengan kehidupan masa kini.'
  },
  {
    id: 'sma10-bind-4',
    grade: '10 SMA',
    subject: 'Bahasa Indonesia',
    questionFormat: 'Reguler Kurikulum Merdeka',
    topic: 'Teks Negosiasi',
    cognitiveLevel: 'Penerapan',
    type: 'single_choice',
    stimulusTitle: 'Kesepakatan Sewa Panggung Pentas Seni SMA',
    stimulusType: 'dialogue',
    stimulusContent:
      'Ketua Panitia OSIS: "Pak, anggaran sewa sound system dan panggung kami maksimal Rp4.500.000 untuk satu hari penuh acara pensi sekolah."\nPemilik Vendor: "Harga standar kami Rp5.200.000, Nak, karena termasuk dua teknisi dan pencahayaan panggung."\nKetua Panitia OSIS: "Bagaimana jika pencahayaan efek asap tidak kami pakai, tetapi teknisi tetap mendampingi dari pagi hingga sore? Dengan begitu kami bisa menambah sedikit menjadi Rp4.750.000."\nPemilik Vendor: "Baiklah, khusus untuk kegiatan sekolah yang edukatif, Rp4.750.000 saya setujui tanpa mesin asap."',
    questionText: 'Unsur penting dalam kutipan dialog akhir Pemilik Vendor merupakan struktur teks negosiasi pada bagian...',
    options: [
      { id: 'A', text: 'Orientasi dan salam pembuka' },
      { id: 'B', text: 'Permintaan awal tanpa syarat' },
      { id: 'C', text: 'Penolakan sepihak dari penyedia jasa' },
      { id: 'D', text: 'Persetujuan sebagai titik temu kepentingan kedua pihak' },
      { id: 'E', text: 'Pengajuan ulang syarat teknis tanpa penyesuaian biaya' }
    ],
    correctAnswer: 'D',
    explanation:
      'Dialog terakhir memperlihatkan pemilik vendor menerima tawaran kompromi OSIS (Rp4.750.000 tanpa mesin asap), yang menandai tercapainya kesepakatan saling menguntungkan (win-win solution) pada tahap persetujuan.',
    keyTakeaway: 'Negosiasi yang berhasil ditandai dengan kesepakatan bersama hasil kompromi kedua belah pihak.'
  },
  {
    id: 'sma10-bind-5',
    grade: '10 SMA',
    subject: 'Bahasa Indonesia',
    questionFormat: 'TKA SMA Terbaru',
    topic: 'Literasi Teks Informasi: Sampah Elektronik',
    cognitiveLevel: 'Interpretasi & Integrasi',
    type: 'multiple_choice',
    stimulusTitle: 'Mengelola Limbah Elektronik (E-Waste) dengan Ekonomi Sirkular',
    stimulusType: 'text',
    stimulusContent:
      'Perkembangan gawai yang sangat cepat memicu lonjakan limbah elektronik (e-waste) seperti baterai bekas, kabel rusak, dan papan sirkuit ponsel. Di Indonesia, laju timbulan e-waste rumah tangga diperkirakan terus naik 8% per tahun, sementara tingkat daur ulang resminya baru berada di bawah 20%. Padahal, satu ton papan sirkuit bekas dapat mengandung logam mulia seperti emas dan tembaga dalam kadar lebih tinggi daripada bijih tambang alami. Tanpa pemilahan khusus, kandungan timbal dan merkuri dalam e-waste berpotensi mencemari air tanah. Model ekonomi sirkular di tingkat sekolah—seperti pengumpulan dropbox barang elektronik rusak yang disalurkan ke pendaur ulang berizin—terbukti efektif mengurangi risiko pencemaran sekaligus memperpanjang umur pakai komponen.',
    stimulusNote: 'Pilih DUA pernyataan yang paling tepat berdasarkan isi teks (Pilihan Ganda Kompleks / MCMA TKA SMA).',
    questionText: 'Manakah dua simpulan inferensial yang paling didukung oleh informasi pada teks tersebut?',
    options: [
      { id: 'A', text: 'Mayoritas limbah elektronik rumah tangga di Indonesia saat ini belum masuk ke jalur daur ulang resmi.' },
      { id: 'B', text: 'Ekstraksi logam mulia dari bijih tambang alami jauh lebih ramah lingkungan daripada mendaur ulang papan sirkuit.' },
      { id: 'C', text: 'Penyediaan dropbox e-waste di sekolah merupakan langkah nyata mengurangi risiko pencemaran logam berat ke air tanah.' },
      { id: 'D', text: 'Kenaikan penggunaan gawai tidak berpengaruh terhadap besarnya timbulan limbah elektronik tahunan.' },
      { id: 'E', text: 'Kandungan tembaga pada papan sirkuit ponsel selalu lebih rendah dibandingkan bijih tambang alami.' }
    ],
    correctAnswer: ['A', 'C'],
    explanation:
      'Pernyataan A benar karena tingkat daur ulang resmi masih di bawah 20% (artinya lebih dari 80% belum terkelola resmi). Pernyataan C benar karena dropbox di sekolah yang disalurkan ke pendaur ulang berizin mencegah timbal dan merkuri mencemari air tanah. B dan D bertentangan dengan isi teks.',
    keyTakeaway: 'Soal TKA SMA menuntut kemampuan menyintesis angka persentase, hubungan sebab-akibat, dan solusi kontekstual dalam bacaan.'
  },
  {
    id: 'sma10-bind-6',
    grade: '10 SMA',
    subject: 'Bahasa Indonesia',
    questionFormat: 'TKA SMA Terbaru',
    topic: 'Evaluasi Fakta, Opini, dan Biografi Inspiratif',
    cognitiveLevel: 'Evaluasi & Refleksi',
    type: 'true_false',
    stimulusTitle: 'Jejak Literasi Sains di Pelosok Nusantara',
    stimulusType: 'text',
    stimulusContent:
      'Sejak tahun 2019, Larasati mendirikan taman baca bertenaga surya di tepi hutan Kalimantan bersama empat relawan mahasiswa. Hingga akhir 2024, taman baca tersebut telah memiliki koleksi 4.200 buku sains populer dan melayani 180 pelajar SMA setiap pekan. Menurut Kepala Dinas Pendidikan setempat, inisiatif Larasati merupakan model pemberdayaan literasi paling kreatif abad ini yang semestinya segera direplikasi di seluruh provinsi. Namun, tantangan utama yang masih dihadapi hingga kini adalah keterbatasan biaya pemeliharaan baterai panel surya saat musim hujan berkepanjangan.',
    questionText: 'Tentukan apakah setiap pernyataan berikut BENAR atau SALAH berdasarkan teks!',
    statements: [
      { id: 's1', text: 'Kalimat yang menyebutkan jumlah 4.200 buku sains populer dan 180 pelajar termasuk fakta yang dapat diverifikasi.' },
      { id: 's2', text: 'Pernyataan bahwa taman baca Larasati adalah model literasi "paling kreatif abad ini" merupakan fakta objektif tanpa sudut pandang.' },
      { id: 's3', text: 'Keberlangsungan energi listrik di taman baca masih menghadapi kendala teknis musiman pada penyimpanan daya.' },
      { id: 's4', text: 'Taman baca tersebut didirikan sepenuhnya oleh pemerintah provinsi sejak tahun 2024.' },
      { id: 's5', text: 'Larasati bekerja seorang diri tanpa melibatkan relawan dalam mengelola taman baca tersebut.' }
    ],
    correctAnswer: { s1: true, s2: false, s3: true, s4: false, s5: false },
    explanation:
      's1 Benar karena angka jumlah buku dan pelajar bersifat terukur (fakta). s2 Salah karena "paling kreatif abad ini" bersifat penilaian subjektif (opini). s3 Benar karena disebutkan kendala biaya pemeliharaan baterai panel surya saat musim hujan. s4 Salah karena didirikan Larasati bersama relawan mahasiswa sejak 2019. s5 Salah karena Larasati bekerja sama dengan empat relawan mahasiswa.',
    keyTakeaway: 'Soal kategori Benar/Salah TKA SMA menguji ketelitian membedakan fakta empiris, opini evaluatif, dan detail eksplisit.'
  },
  {
    id: 'sma10-bind-7',
    grade: '10 SMA',
    subject: 'Bahasa Indonesia',
    questionFormat: 'TKA SMA Terbaru',
    topic: 'Evaluasi Argumen & Teks Diskusi',
    cognitiveLevel: 'Evaluasi & Refleksi',
    type: 'single_choice',
    stimulusTitle: 'Debat Penggunaan AI Generatif dalam Tugas Menulis SMA',
    stimulusType: 'dialogue',
    stimulusContent:
      'Pembicara Pro: "AI generatif dapat bertindak sebagai mitra diskusi untuk mencari kerangka berpikir sehingga siswa lebih percaya diri merancang esai."\nPembicara Kontra: "Jika siswa langsung menyalin draf buatan AI, kemampuan bernalar kritis dan suara personal penulis akan tumpul. Terlebih lagi, hasil survei internal OSIS terhadap 120 siswa menunjukkan 68% pengguna AI tidak memeriksa ulang keakuratan sitasi yang dihasilkan mesin."\nModerator: "Oleh sebab itu, kita perlu menilai argumen mana yang lebih terukur oleh data empiris."',
    questionText: 'Berdasarkan dialog di atas, mengapa argumen Pembicara Kontra dinilai memiliki bobot pembuktian yang lebih kuat?',
    options: [
      { id: 'A', text: 'Karena Pembicara Kontra melarang penggunaan seluruh teknologi komputer di sekolah.' },
      { id: 'B', text: 'Karena Pembicara Kontra menyertakan bukti survei kuantitatif tentang risiko kesalahan sitasi oleh pengguna AI.' },
      { id: 'C', text: 'Karena Pembicara Pro tidak memahami cara membuat kerangka berpikir esai.' },
      { id: 'D', text: 'Karena Moderator secara langsung membenarkan larangan total pemakaian AI.' },
      { id: 'E', text: 'Karena Pembicara Kontra menyampaikan pendapat dengan durasi bicara paling lama.' }
    ],
    correctAnswer: 'B',
    explanation:
      'Pembicara Kontra memperkuat klaim risikonya menggunakan data kuantitatif spesifik (survei 120 siswa, 68% tidak memverifikasi sitasi), sedangkan Pembicara Pro baru menyampaikan asumsi manfaat umum tanpa dukungan data.',
    keyTakeaway: 'Dalam TKA Penalaran Verbal, argumen yang kuat ditopang oleh bukti empiris yang relevan dengan klaimnya.'
  },

  // =========================================================================
  // KELAS 10 SMA (FASE E KURIKULUM MERDEKA) - BAHASA INGGRIS (7 Soal)
  // 3 Soal Reguler Kurikulum Merdeka + 4 Soal Model TKA SMA Terbaru
  // =========================================================================
  {
    id: 'sma10-bing-1',
    grade: '10 SMA',
    subject: 'Bahasa Inggris',
    questionFormat: 'Reguler Kurikulum Merdeka',
    topic: 'Descriptive Text (Ecotourism)',
    cognitiveLevel: 'Pemahaman',
    type: 'single_choice',
    stimulusTitle: 'The Enchanting Blue Fire of Ijen Crater',
    stimulusType: 'text',
    stimulusContent:
      'Nestled on the border of Banyuwangi and Bondowoso in East Java, Ijen Crater is famous worldwide for its rare nocturnal phenomenon known as the "Blue Fire." Unlike lava, this electric-blue glow is caused by ignited sulfuric gas emerging from cracks in the volcano at temperatures exceeding 360 degrees Celsius. Visitors usually begin their trek before midnight to witness the mesmerizing blue flames before dawn illuminates the turquoise acidic lake inside the caldera.',
    questionText: 'According to the text, what actually causes the electric-blue glow at Ijen Crater?',
    options: [
      { id: 'A', text: 'Reflected sunlight hitting the turquoise acidic lake at dawn' },
      { id: 'B', text: 'Sulfuric gas igniting as it escapes volcanic cracks at very high temperatures' },
      { id: 'C', text: 'Molten blue lava flowing rapidly down the slopes of Banyuwangi' },
      { id: 'D', text: 'Flashlights carried by tourists hiking before midnight' },
      { id: 'E', text: 'Chemical dye poured into the acidic crater lake every evening' }
    ],
    correctAnswer: 'B',
    explanation:
      'Teks menyatakan secara eksplisit: "Unlike lava, this electric-blue glow is caused by ignited sulfuric gas emerging from cracks in the volcano at temperatures exceeding 360 degrees Celsius."',
    keyTakeaway: 'Descriptive text Kurikulum Merdeka Fase E sering menggali informasi faktual spesifik mengenai fenomena alam dan ekowisata.'
  },
  {
    id: 'sma10-bing-2',
    grade: '10 SMA',
    subject: 'Bahasa Inggris',
    questionFormat: 'Reguler Kurikulum Merdeka',
    topic: 'Recount Text (Personal Experience)',
    cognitiveLevel: 'Penerapan',
    type: 'single_choice',
    stimulusTitle: 'My First Youth Climate Hackathon',
    stimulusType: 'text',
    stimulusContent:
      'Last month, my two classmates and I participated in a 24-hour Youth Climate Hackathon in Bandung. At first, we felt overwhelmed because almost every team already had advanced coding prototypes. However, instead of giving up, we decided to focus on a practical problem at our own school: food waste in the canteen. By midnight, we designed a simple weekly portion-tracking board and interviewed five canteen vendors. Although we did not win first place, the judges praised our realistic local solution and awarded us the Best Community Impact prize.',
    questionText: 'What is the main communicative purpose of the text above?',
    options: [
      { id: 'A', text: 'To persuade students in Bandung to stop buying food at school canteens' },
      { id: 'B', text: 'To explain step-by-step instructions on how to build a coding prototype' },
      { id: 'C', text: 'To retell the writer’s challenging yet rewarding experience in a competition' },
      { id: 'D', text: 'To criticize hackathon judges for ignoring advanced coding teams' },
      { id: 'E', text: 'To advertise an annual 24-hour coding course for teenagers in Bandung' }
    ],
    correctAnswer: 'C',
    explanation:
      'Teks tersebut merupakan Recount Text (ditandai keterangan waktu lampau "Last month" dan kata kerja lampau seperti participated, felt, designed) yang bertujuan menceritakan kembali pengalaman penulis mengikuti kompetisi.',
    keyTakeaway: 'Identifikasi fungsi sosial Recount Text adalah menceritakan peristiwa atau pengalaman masa lalu secara kronologis.'
  },
  {
    id: 'sma10-bing-3',
    grade: '10 SMA',
    subject: 'Bahasa Inggris',
    questionFormat: 'Reguler Kurikulum Merdeka',
    topic: 'Procedure Text (Healthy Digital Habits)',
    cognitiveLevel: 'Penerapan',
    type: 'single_choice',
    stimulusTitle: 'Practical Steps to Reduce Digital Eye Strain',
    stimulusType: 'text',
    stimulusContent:
      '1. Apply the 20-20-20 rule: every 20 minutes, look at an object 20 feet away for at least 20 seconds.\n2. Position your laptop screen slightly below eye level, roughly an arm’s length from your face.\n3. Adjust screen brightness so it matches the lighting of your study room—avoid studying with a bright screen in total darkness.\n4. Enable night-shift or warm-light filter one hour before bedtime to protect your sleep cycle.',
    questionText: 'Why should students avoid studying with a bright screen in a completely dark room according to step 3?',
    options: [
      { id: 'A', text: 'Because screen brightness should stay balanced with surrounding room lighting' },
      { id: 'B', text: 'Because laptops automatically shut down in dark rooms' },
      { id: 'C', text: 'Because the 20-20-20 rule only works in outdoor sunlight' },
      { id: 'D', text: 'Because warm-light filters make the text invisible during the day' },
      { id: 'E', text: 'Because bright screens permanently erase night-shift settings in dark rooms' }
    ],
    correctAnswer: 'A',
    explanation:
      'Langkah ke-3 menjelaskan: "Adjust screen brightness so it matches the lighting of your study room—avoid studying with a bright screen in total darkness." Tujuannya agar kontras layar tetap seimbang dengan pencahayaan sekitar.',
    keyTakeaway: 'Dalam Procedure Text, pahami alasan fungsional (purpose/reason) di balik setiap kalimat imperatif.'
  },
  {
    id: 'sma10-bing-4',
    grade: '10 SMA',
    subject: 'Bahasa Inggris',
    questionFormat: 'TKA SMA Terbaru',
    topic: 'Analytical Exposition (Literasi TKA SMA)',
    cognitiveLevel: 'Interpretasi & Integrasi',
    type: 'multiple_choice',
    stimulusTitle: 'Why School Libraries Need Quiet Collaborative & Digital Zones',
    stimulusType: 'text',
    stimulusContent:
      'Traditional libraries were built on a strict rule of absolute silence, yet modern Kurikulum Merdeka projects require teamwork and digital research. Critics worry that allowing group discussion will destroy the peaceful reading atmosphere. However, redesigning libraries into two distinct zones—a sound-insulated quiet reading room and a collaborative digital hub—offers a balanced solution. Schools that adopted zoned libraries reported a 35% increase in afternoon student visits without reducing borrowing rates of printed books.',
    stimulusNote: 'Pilih DUA jawaban yang paling tepat (Pilihan Ganda Kompleks TKA Literasi Bahasa Inggris).',
    questionText: 'Which TWO statements best reflect the writer’s arguments in the passage?',
    options: [
      { id: 'A', text: 'Printed books should be completely removed to make room for digital hubs.' },
      { id: 'B', text: 'Separating spaces into quiet and collaborative zones resolves the conflict between silent reading and project teamwork.' },
      { id: 'C', text: 'Absolute silence is still the best rule for all parts of a modern library.' },
      { id: 'D', text: 'Data from zoned school libraries shows higher student engagement without harming printed book circulation.' },
      { id: 'E', text: 'Group discussions always decrease printed book borrowing rates across all schools.' }
    ],
    correctAnswer: ['B', 'D'],
    explanation:
      'B sesuai dengan solusi "redesigning libraries into two distinct zones" untuk mengakomodasi baca hening dan kerja proyek. D didukung kalimat terakhir bahwa kunjungan sore naik 35% tanpa menurunkan peminjaman buku cetak.',
    keyTakeaway: 'Pada soal TKA Bahasa Inggris MCMA, cocokkan setiap opsi dengan bukti argumen dan data penulis.'
  },
  {
    id: 'sma10-bing-5',
    grade: '10 SMA',
    subject: 'Bahasa Inggris',
    questionFormat: 'TKA SMA Terbaru',
    topic: 'Critical Reading: Fast Fashion vs. Thrifting',
    cognitiveLevel: 'Evaluasi & Refleksi',
    type: 'true_false',
    stimulusTitle: 'Teen Consumer Thread: Is Thrifting Always Sustainable?',
    stimulusType: 'dialogue',
    stimulusContent:
      'Nadia: "Buying secondhand jackets helps keep wearable clothes out of landfills and saves my monthly allowance!"\nBima: "True, thrifting is great when you buy only what you need. But lately, some influencers buy 20 thrifted shirts every week just for haul videos, which still promotes overconsumption and drives up prices for local buyers who depend on affordable clothing."\nNadia: "Good point, Bima. Mindful consumption matters more than just the label secondhand."',
    questionText: 'Determine whether each statement is TRUE or FALSE based on the dialogue!',
    statements: [
      { id: 's1', text: 'Nadia initially highlights both environmental and financial benefits of buying secondhand clothes.' },
      { id: 's2', text: 'Bima argues that buying secondhand clothes in large quantities every week causes zero negative effects.' },
      { id: 's3', text: 'Both speakers eventually agree that the habit of mindful consumption is more important than the trend itself.' },
      { id: 's4', text: 'Bima claims secondhand clothing has become completely unaffordable for influencers.' },
      { id: 's5', text: 'Bima warns that excessive influencer thrift hauls can raise prices for local buyers who need affordable clothes.' }
    ],
    correctAnswer: { s1: true, s2: false, s3: true, s4: false, s5: true },
    explanation:
      's1 True ("keep wearable clothes out of landfills" & "saves my monthly allowance"). s2 False (Bima warns excessive weekly hauls still promote overconsumption and raise prices for local buyers). s3 True (Nadia concludes mindful consumption matters more). s4 False (price surge affects local buyers who depend on affordable clothing). s5 True (Bima explicitly notes excessive hauls drive up prices for local buyers).',
    keyTakeaway: 'Soal Benar/Salah dialog TKA SMA menguji pemahaman nuansa sikap pembicara dan konsensus akhir diskusi.'
  },
  {
    id: 'sma10-bing-6',
    grade: '10 SMA',
    subject: 'Bahasa Inggris',
    questionFormat: 'TKA SMA Terbaru',
    topic: 'Multimodal Reading: School Green Energy Comparison',
    cognitiveLevel: 'Penalaran',
    type: 'single_choice',
    stimulusTitle: 'Comparison of Two Green Projects Proposed by SMA Garuda',
    stimulusType: 'table',
    stimulusContent:
      'The student council compared two eco-initiatives based on installation cost, payback time, and monthly water or electricity savings.',
    stimulusTableData: {
      headers: ['Project Option', 'Upfront Cost', 'Monthly Utility Saving', 'Maintenance Need'],
      rows: [
        ['Solar Roof Panels (6 kWp)', 'Rp72.000.000', 'Rp1.500.000 / month', 'Low (annual cleaning)'],
        ['Rainwater Harvesting Tanks', 'Rp24.000.000', 'Rp600.000 / month', 'Medium (filter check)']
      ]
    },
    questionText: 'If the school prioritizes recovering its initial investment in a shorter number of months, which conclusion is mathematically and contextually accurate?',
    options: [
      { id: 'A', text: 'Solar Roof Panels recover their cost faster because monthly savings are higher.' },
      { id: 'B', text: 'Both projects require exactly 36 months to break even.' },
      { id: 'C', text: 'Rainwater Harvesting Tanks never recover their cost due to medium maintenance.' },
      { id: 'D', text: 'Rainwater Harvesting Tanks recover their cost sooner (40 months compared to 48 months for Solar Panels).' },
      { id: 'E', text: 'Solar Roof Panels require zero annual cleaning and pay back in 24 months.' }
    ],
    correctAnswer: 'D',
    explanation:
      'Break-even Solar Panels = 72.000.000 / 1.500.000 = 48 bulan. Break-even Rainwater Tanks = 24.000.000 / 600.000 = 40 bulan. Jadi Rainwater Harvesting lebih cepat balik modal (40 bulan vs 48 bulan).',
    keyTakeaway: 'TKA SMA menggabungkan pemahaman teks Bahasa Inggris dengan penalaran numerik dari tabel data.'
  },
  {
    id: 'sma10-bing-7',
    grade: '10 SMA',
    subject: 'Bahasa Inggris',
    questionFormat: 'TKA SMA Terbaru',
    topic: 'Dual Opinion Evaluation: Smartphones at School',
    cognitiveLevel: 'Evaluasi & Refleksi',
    type: 'multiple_choice',
    stimulusTitle: 'Policy Review: Smartphones During Break Time',
    stimulusType: 'text',
    stimulusContent:
      'Perspective 1 (Principal): "When we collected smartphones in homeroom lockers during the entire school day, hallway conversations and outdoor sports participation during break time doubled within two months."\nPerspective 2 (Student Representative): "We appreciate healthier social breaks, yet some students rely on phones during lunch to coordinate afternoon pick-ups with working parents or check digital club schedules. A 15-minute access window near dismissal might bridge both needs."',
    stimulusNote: 'Pilih DUA pernyataan inferensi yang paling valid berdasarkan kedua perspektif.',
    questionText: 'Which TWO inferences can be logically drawn from both perspectives?',
    options: [
      { id: 'A', text: 'The locker policy measurably increased face-to-face student interaction during breaks.' },
      { id: 'B', text: 'The student representative demands unlimited smartphone use inside every classroom.' },
      { id: 'C', text: 'A compromise policy allowing brief phone access near dismissal could address parent coordination without ruining break-time socializing.' },
      { id: 'D', text: 'Working parents strongly opposed outdoor sports activities at school.' },
      { id: 'E', text: 'Collecting phones in homeroom lockers lasted only for a single school day.' }
    ],
    correctAnswer: ['A', 'C'],
    explanation:
      'A didukung fakta bahwa percakapan di koridor dan olahraga istirahat meningkat dua kali lipat. C mencerminkan usulan kompromi perwakilan siswa ("15-minute access window near dismissal").',
    keyTakeaway: 'Evaluasi dua sudut pandang pada TKA menekankan identifikasi titik temu (compromise) dan bukti dampak nyata.'
  },

  // =========================================================================
  // KELAS 10 SMA (FASE E KURIKULUM MERDEKA) - MATEMATIKA (6 Soal)
  // 3 Soal Reguler Kurikulum Merdeka + 3 Soal Model TKA SMA Terbaru
  // =========================================================================
  {
    id: 'sma10-mat-1',
    grade: '10 SMA',
    subject: 'Matematika',
    questionFormat: 'Reguler Kurikulum Merdeka',
    topic: 'Eksponen dan Bentuk Akar',
    cognitiveLevel: 'Penerapan',
    type: 'single_choice',
    stimulusTitle: 'Persamaan Eksponensial Sederhana',
    stimulusType: 'text',
    stimulusContent:
      'Dalam mempelajari materi Eksponen Kelas 10 Kurikulum Merdeka, siswa diminta menyelesaikan persamaan pangkat dengan menyamakan bilangan pokok (basis) kedua ruas.',
    questionText: 'Jika 3^(2x - 1) = 27 · √3, maka nilai x yang memenuhi persamaan tersebut adalah...',
    options: [
      { id: 'A', text: '1,75' },
      { id: 'B', text: '2,25' },
      { id: 'C', text: '2,50' },
      { id: 'D', text: '3,00' },
      { id: 'E', text: '3,25' }
    ],
    correctAnswer: 'B',
    explanation:
      'Ubah ruas kanan ke basis 3: 27 = 3^3 dan √3 = 3^(1/2), sehingga 27 · √3 = 3^(3 + 1/2) = 3^(7/2). Samakan pangkat: 2x - 1 = 7/2 => 2x = 9/2 => x = 9/4 = 2,25.',
    keyTakeaway: 'Samakan basis kedua ruas persamaan eksponen, lalu operasikan eksponennya secara linear.'
  },
  {
    id: 'sma10-mat-2',
    grade: '10 SMA',
    subject: 'Matematika',
    questionFormat: 'Reguler Kurikulum Merdeka',
    topic: 'Barisan dan Deret Geometri',
    cognitiveLevel: 'Penerapan',
    type: 'single_choice',
    stimulusTitle: 'Pertumbuhan Koloni Bakteri di Laboratorium Biologi',
    stimulusType: 'text',
    stimulusContent:
      'Pada pengamatan praktikum biologi kelas 10, suatu jenis bakteri membelah diri menjadi 2 kali lipat setiap 20 menit. Pada awal pengamatan pukul 08.00 WIB, tercatat ada 50 ekor bakteri pada cawan petri.',
    questionText: 'Jika tidak ada bakteri yang mati selama pengamatan, banyak bakteri tepat pada pukul 10.00 WIB adalah...',
    options: [
      { id: 'A', text: '1.600 bakteri' },
      { id: 'B', text: '2.400 bakteri' },
      { id: 'C', text: '3.200 bakteri' },
      { id: 'D', text: '6.400 bakteri' },
      { id: 'E', text: '4.800 bakteri' }
    ],
    correctAnswer: 'C',
    explanation:
      'Rentang waktu 08.00 hingga 10.00 = 2 jam = 120 menit. Banyak periode pembelahan n = 120 / 20 = 6 kali. Jumlah bakteri = a · r^n = 50 · 2^6 = 50 · 64 = 3.200 bakteri.',
    keyTakeaway: 'Model pertumbuhan eksponensial bakteri mengikuti rumus N = N₀ · r^n dengan n = total waktu / periode pembelahan.'
  },
  {
    id: 'sma10-mat-3',
    grade: '10 SMA',
    subject: 'Matematika',
    questionFormat: 'Reguler Kurikulum Merdeka',
    topic: 'Trigonometri Segitiga Siku-Siku',
    cognitiveLevel: 'Pemahaman',
    type: 'single_choice',
    stimulusTitle: 'Mengukur Tinggi Menara Sekolah dengan Klinometer',
    stimulusType: 'text',
    stimulusContent:
      'Siswa kelas 10 melakukan proyek pengukuran tinggi menara pemancar sekolah menggunakan klinometer sederhana. Siswa berdiri mendatar sejauh 24 meter dari dasar menara. Dengan tinggi mata pengamat 1,6 meter dari tanah, sudut elevasi puncak menara menghasilkan nilai tangen sebesar tan α = 3/4.',
    questionText: 'Berdasarkan pengukuran tersebut, tinggi menara pemancar dari permukaan tanah adalah...',
    options: [
      { id: 'A', text: '18,0 meter' },
      { id: 'B', text: '19,6 meter' },
      { id: 'C', text: '21,6 meter' },
      { id: 'D', text: '33,6 meter' },
      { id: 'E', text: '25,6 meter' }
    ],
    correctAnswer: 'B',
    explanation:
      'tan α = sisi depan / sisi samping => 3/4 = h_atas / 24 => h_atas = (3 × 24) / 4 = 18 meter. Tinggi total menara = h_atas + tinggi mata pengamat = 18 + 1,6 = 19,6 meter.',
    keyTakeaway: 'Jangan lupa menambahkan tinggi mata pengamat pada aplikasi sudut elevasi trigonometri.'
  },
  {
    id: 'sma10-mat-4',
    grade: '10 SMA',
    subject: 'Matematika',
    questionFormat: 'TKA SMA Terbaru',
    topic: 'Fungsi Kuadrat & Optimasi Kontekstual',
    cognitiveLevel: 'Penalaran',
    type: 'multiple_choice',
    stimulusTitle: 'Perancangan Taman Hidroponik Sekolah',
    stimulusType: 'text',
    stimulusContent:
      'Tim Adiwiyata SMA memiliki kawat pagar sepanjang 40 meter untuk membuat taman hidroponik berbentuk persegi panjang. Salah satu sisi panjang taman langsung menempel pada dinding tembok aula sehingga tidak memerlukan pagar kawat. Misalkan lebar kedua sisi tegak lurus tembok masing-masing adalah x meter, maka sisi panjang yang dipagari kawat adalah (40 - 2x) meter.',
    stimulusNote: 'Pilih DUA pernyataan yang bernilai BENAR berdasarkan pemodelan fungsi kuadrat di atas (MCMA TKA SMA).',
    questionText: 'Pernyataan manakah yang benar mengenai luas taman hidroponik L(x)?',
    options: [
      { id: 'A', text: 'Fungsi luas taman terhadap lebar x adalah L(x) = 40x - 2x².' },
      { id: 'B', text: 'Luas maksimum taman tercapai ketika lebar x = 20 meter.' },
      { id: 'C', text: 'Luas maksimum taman yang dapat dibuat adalah 200 m².' },
      { id: 'D', text: 'Agar luas taman tepat 150 m², lebar x yang memenuhi adalah 12 meter.' },
      { id: 'E', text: 'Jika lebar x = 5 meter, panjang sisi taman yang dipagari kawat adalah 20 meter.' }
    ],
    correctAnswer: ['A', 'C'],
    explanation:
      'A Benar: L(x) = x(40 - 2x) = 40x - 2x². B Salah: sumbu simetri x = -b/(2a) = -40 / (2·(-2)) = 10 m. C Benar: L(10) = 40(10) - 2(100) = 200 m². D Salah: 40x - 2x² = 150 => x² - 20x + 75 = 0 => (x - 5)(x - 15) = 0, jadi x = 5 m atau x = 15 m.',
    keyTakeaway: 'Pada optimasi fungsi kuadrat L(x) = ax² + bx + c (a < 0), nilai maksimum dicapai di x = -b / (2a).'
  },
  {
    id: 'sma10-mat-5',
    grade: '10 SMA',
    subject: 'Matematika',
    questionFormat: 'TKA SMA Terbaru',
    topic: 'Sistem Persamaan Linear Tiga Variabel (SPLTV)',
    cognitiveLevel: 'Penalaran',
    type: 'true_false',
    stimulusTitle: 'Daftar Paket Alat Tulis Koperasi SMA',
    stimulusType: 'table',
    stimulusContent:
      'Koperasi siswa menyediakan tiga paket alat tulis menjelang ujian semester tanpa diskon tambahan, sebagaimana tercatat pada tabel berikut.',
    stimulusTableData: {
      headers: ['Nama Paket', 'Isi Paket', 'Harga Total'],
      rows: [
        ['Paket Hemat', '2 Buku Tulis + 1 Pulpen + 1 Map', 'Rp23.000'],
        ['Paket Cerdas', '1 Buku Tulis + 2 Pulpen + 1 Map', 'Rp21.000'],
        ['Paket Prestasi', '3 Buku Tulis + 2 Pulpen + 2 Map', 'Rp40.000']
      ]
    },
    questionText: 'Tentukan apakah setiap pernyataan berikut BENAR atau SALAH berdasarkan harga satuan barang!',
    statements: [
      { id: 's1', text: 'Harga satuan 1 buku tulis adalah Rp6.000.' },
      { id: 's2', text: 'Harga 1 pulpen lebih mahal daripada harga 1 map.' },
      { id: 's3', text: 'Selisih harga antara 1 buku tulis dan 1 pulpen adalah Rp2.000.' },
      { id: 's4', text: 'Untuk membeli 2 buku tulis dan 3 pulpen tanpa map, siswa cukup membayar Rp22.000.' },
      { id: 's5', text: 'Harga 1 buku tulis ditambah 1 map sama dengan Rp13.000.' }
    ],
    correctAnswer: { s1: true, s2: false, s3: true, s4: false, s5: true },
    explanation:
      'Misal b = buku, p = pulpen, m = map. Pers (1) 2b+p+m=23.000; (2) b+2p+m=21.000; (3) 3b+2p+2m=40.000. Jumlah (1)+(2): 3b+3p+2m=44.000. Kurangi (3): p = 4.000. Dari (1)-(2): b-p = 2.000 => b = 6.000. Substitusi ke (1): 12.000+4.000+m=23.000 => m = 7.000. Jadi: s1 Benar (b=6.000), s2 Salah (p=4.000 < m=7.000), s3 Benar (6.000-4.000=2.000), s4 Salah (2(6.000)+3(4.000)=24.000), s5 Benar (6.000+7.000=13.000).',
    keyTakeaway: 'Manfaatkan kombinasi penjumlahan/pengurangan antar persamaan SPLTV agar eliminasi variabel menjadi cepat dan akurat.'
  },
  {
    id: 'sma10-mat-6',
    grade: '10 SMA',
    subject: 'Matematika',
    questionFormat: 'TKA SMA Terbaru',
    topic: 'Statistika & Persentase Ketuntasan',
    cognitiveLevel: 'Penalaran',
    type: 'single_choice',
    stimulusTitle: 'Distribusi Nilai Simulasi Asesmen Kelas 10',
    stimulusType: 'table',
    stimulusContent:
      'Berikut adalah tabel sebaran nilai simulasi Matematika dari 20 siswa kelas 10 SMA.',
    stimulusTableData: {
      headers: ['Nilai', '60', '70', '80', '90', '100'],
      rows: [
        ['Frekuensi (Siswa)', 2, 5, 8, 3, 2]
      ]
    },
    questionText: 'Siswa dinyatakan tuntas apabila memperoleh nilai di atas rata-rata kelas. Persentase siswa yang dinyatakan tuntas adalah...',
    options: [
      { id: 'A', text: '25%' },
      { id: 'B', text: '40%' },
      { id: 'C', text: '65%' },
      { id: 'D', text: '79%' },
      { id: 'E', text: '85%' }
    ],
    correctAnswer: 'C',
    explanation:
      'Total skor = (60×2) + (70×5) + (80×8) + (90×3) + (100×2) = 120 + 350 + 640 + 270 + 200 = 1.580. Rata-rata = 1.580 / 20 = 79. Nilai di atas 79 adalah 80, 90, dan 100 dengan jumlah siswa = 8 + 3 + 2 = 13 siswa. Persentase tuntas = (13/20) × 100% = 65%.',
    keyTakeaway: 'Hitung nilai rata-rata berbobot lebih dulu sebelum menentukan batas ketuntasan siswa.'
  },

  // =========================================================================
  // KELAS 11 SMA (FASE F KURIKULUM MERDEKA) - BAHASA INDONESIA (7 Soal)
  // 3 Soal Reguler Kurikulum Merdeka + 4 Soal Model TKA SMA Terbaru
  // =========================================================================
  {
    id: 'sma11-bind-1',
    grade: '11 SMA',
    subject: 'Bahasa Indonesia',
    questionFormat: 'Reguler Kurikulum Merdeka',
    topic: 'Teks Argumentasi Ketahanan Pangan',
    cognitiveLevel: 'Pemahaman',
    type: 'single_choice',
    stimulusTitle: 'Diversifikasi Pangan Lokal Berbasis Sorgum dan Sagu',
    stimulusType: 'text',
    stimulusContent:
      'Ketergantungan tinggi terhadap satu komoditas beras membuat ketahanan pangan nasional rentan terhadap gejolak iklim. Padahal, Indonesia memiliki beragam sumber karbohidrat lokal seperti sorgum di Nusa Tenggara Timur, sagu di Papua dan Maluku, serta singkong di Jawa. Sorgum mampu tumbuh di lahan kering dengan kebutuhan air hanya sepertiga tanaman padi. Oleh sebab itu, pengembangan agroindustri pangan lokal perlu diperkuat dari hulu hingga hilir.',
    questionText: 'Pola pengembangan dan ide pokok paragraf argumentasi tersebut adalah...',
    options: [
      { id: 'A', text: 'Ketergantungan pada satu jenis pangan membuat ketahanan pangan rentan sehingga diversifikasi pangan lokal sangat penting (Deduktif-Induktif/Campuran).' },
      { id: 'B', text: 'Sorgum hanya dapat tumbuh subur di Pulau Jawa dengan pengairan intensif.' },
      { id: 'C', text: 'Pemerintah harus mengimpor sagu dan singkong untuk menekan konsumsi beras.' },
      { id: 'D', text: 'Beras merupakan satu-satunya komoditas yang bernilai ekonomi bagi petani daerah kering.' },
      { id: 'E', text: 'Tanaman singkong dan sagu memerlukan pengairan jauh lebih banyak daripada tanaman padi.' }
    ],
    correctAnswer: 'A',
    explanation:
      'Kalimat pertama memaparkan tesis masalah (kerentanan ketergantungan beras), diikuti alasan pendukung (sorgum, sagu, singkong), dan ditutup simpulan penguatan di kalimat akhir (campuran/argumentasi logis).',
    keyTakeaway: 'Materi Teks Argumentasi Kurikulum Merdeka Kelas 11 menekankan identifikasi klaim utama dan bukti faktual.'
  },
  {
    id: 'sma11-bind-2',
    grade: '11 SMA',
    subject: 'Bahasa Indonesia',
    questionFormat: 'Reguler Kurikulum Merdeka',
    topic: 'Teks Berita & Kaidah Kebahasaan EYD V',
    cognitiveLevel: 'Penerapan',
    type: 'single_choice',
    stimulusTitle: 'Penyuntingan Kalimat Berita Pendidikan',
    stimulusType: 'text',
    stimulusContent:
      'Perhatikan draf kalimat berita berikut:\n(1) Para siswa-siswi SMA melaksanakan pameran inovasi teknologi ramah lingkungan di aula.\n(2) Kegiatan tersebut bertujuan untuk meningkatkan kreatifitas dan kesadaran ekologis.\n(3) Dalam pameran itu, tim riset mempresentasikan alat pemantau kualitas udara berbasis sensor.\n(4) Kepala sekolah mengapresiasi hasil kerja keras seluruh peserta didik.',
    questionText: 'Kalimat berita yang efektif serta menerapkan penulisan kata baku yang tepat sesuai EYD Edisi V adalah...',
    options: [
      { id: 'A', text: 'Kalimat (1) dan (2)' },
      { id: 'B', text: 'Kalimat (2) dan (3)' },
      { id: 'C', text: 'Kalimat (3) dan (4)' },
      { id: 'D', text: 'Kalimat (1) dan (4)' },
      { id: 'E', text: 'Kalimat (2) dan (4)' }
    ],
    correctAnswer: 'C',
    explanation:
      'Kalimat (1) tidak efektif karena pleonasme ("Para siswa-siswi", seharusnya "Para siswa" atau "Siswa-siswi"). Kalimat (2) tidak baku pada kata "kreatifitas" (baku: kreativitas) serta kelewahan "bertujuan untuk". Kalimat (3) dan (4) sudah efektif dan baku.',
    keyTakeaway: 'Hindari bentuk jamak ganda (pleonasme) dan perhatikan penulisan kata serapan baku (-ivitas, bukan -ifitas).'
  },
  {
    id: 'sma11-bind-3',
    grade: '11 SMA',
    subject: 'Bahasa Indonesia',
    questionFormat: 'Reguler Kurikulum Merdeka',
    topic: 'Karya Ilmiah & Penulisan Daftar Pustaka',
    cognitiveLevel: 'Penerapan',
    type: 'single_choice',
    stimulusTitle: 'Penyusunan Daftar Pustaka Karya Ilmiah Siswa',
    stimulusType: 'text',
    stimulusContent:
      'Seorang siswa kelas 11 menyusun karya ilmiah tentang literasi digital dan mengutip buku berjudul "Cakap Bermedia di Era Algoritma" yang ditulis oleh Rahmat Hidayat, diterbitkan oleh Pustaka Nusantara di Yogyakarta pada tahun 2023.',
    questionText: 'Penulisan daftar pustaka yang paling tepat sesuai kaidah penulisan karya ilmiah bahasa Indonesia adalah...',
    options: [
      { id: 'A', text: 'Rahmat Hidayat. 2023. Cakap Bermedia di Era Algoritma. Yogyakarta: Pustaka Nusantara.' },
      { id: 'B', text: 'Hidayat, Rahmat. 2023. "Cakap Bermedia di Era Algoritma". Pustaka Nusantara: Yogyakarta.' },
      { id: 'C', text: 'Hidayat, Rahmat. Yogyakarta: Pustaka Nusantara. 2023. Cakap Bermedia di Era Algoritma.' },
      { id: 'D', text: 'Hidayat, Rahmat. 2023. Cakap Bermedia di Era Algoritma. Yogyakarta: Pustaka Nusantara.' },
      { id: 'E', text: 'Hidayat, R. Yogyakarta, 2023. Cakap Bermedia di Era Algoritma: Pustaka Nusantara.' }
    ],
    correctAnswer: 'D',
    explanation:
      'Urutan standar penulisan daftar pustaka dari sumber buku: Nama Belakang, Nama Depan. Tahun Terbit. Judul Buku (dicetak miring dalam naskah cetak, tanpa tanda kutip). Kota Terbit: Penerbit.',
    keyTakeaway: 'Ingat urutan baku daftar pustaka: Na-Ta-Ju-Ko-Pen (Nama dibalik, Tahun, Judul, Kota: Penerbit).'
  },
  {
    id: 'sma11-bind-4',
    grade: '11 SMA',
    subject: 'Bahasa Indonesia',
    questionFormat: 'TKA SMA Terbaru',
    topic: 'Apresiasi Cerpen Sejarah (Fase F)',
    cognitiveLevel: 'Interpretasi & Integrasi',
    type: 'multiple_choice',
    stimulusTitle: 'Catatan dari Stasiun Tua',
    stimulusType: 'text',
    stimulusContent:
      'Kereta uap terakhir baru saja berangkat meninggalkan peron yang diguyur gerimis. Di sudut bangku kayu, Kartono menggenggam tas kulit usang berisi naskah pamflet percetakan rakyat. Meski kakinya masih gemetar akibat interogasi kemarin sore, sorot matanya tetap teguh menatap jalur rel yang menghilang di balik kabut. Ia tahu apabila ia tertangkap malam ini, mesin cetak tua di gudang selatan tidak akan lagi berbunyi esok fajar. Namun, membiarkan kebohongan terus dicetak sebagai berita resmi jauh lebih menyakitkan daripada dinginnya sel tahanan.',
    stimulusNote: 'Pilih DUA pernyataan yang paling sesuai untuk menggambarkan karakter dan konflik batin tokoh (MCMA TKA SMA).',
    questionText: 'Berdasarkan kutipan cerpen sejarah tersebut, dua pernyataan manakah yang tepat?',
    options: [
      { id: 'A', text: 'Tokoh Kartono memiliki keberanian moral yang melampaui rasa takut pribadinya demi menjaga kebenaran informasi.' },
      { id: 'B', text: 'Kartono merasa menyesal pernah bekerja di percetakan rakyat dan berniat membakar seluruh pamfletnya.' },
      { id: 'C', text: 'Situasi latar waktu dan tempat menggambarkan suasana santai tanpa ancaman keselamatan.' },
      { id: 'D', text: 'Konflik batin tokoh muncul antara mempertimbangkan keselamatan diri dari risiko penangkapan dan tanggung jawab mempertahankan suara kebenaran.' },
      { id: 'E', text: 'Kartono berencana naik kereta uap ke luar negeri untuk meninggalkan percetakan rakyat selamanya.' }
    ],
    correctAnswer: ['A', 'D'],
    explanation:
      'A benar karena meskipun kakinya masih gemetar pasca-interogasi, ia memilih melawan penyebaran kebohongan. D benar karena terlihat pergulatan antara ancaman sel tahanan/terhentinya mesin cetak dan prinsip kebenaran. B dan C tidak sesuai teks.',
    keyTakeaway: 'Analisis karya sastra TKA SMA menuntut pembacaan mendalam terhadap konflik batin dan motivasi tokoh.'
  },
  {
    id: 'sma11-bind-5',
    grade: '11 SMA',
    subject: 'Bahasa Indonesia',
    questionFormat: 'TKA SMA Terbaru',
    topic: 'Integrasi Teks Editorial & Tabel Data',
    cognitiveLevel: 'Evaluasi & Refleksi',
    type: 'true_false',
    stimulusTitle: 'Optimalisasi Bus Sekolah Ramah Pelajar',
    stimulusType: 'table',
    stimulusContent:
      'Pemerintah kota menguji coba rute Bus Sekolah Gratis di tiga koridor sejak semester ganjil guna menekan kemacetan pagi hari dan mengurangi angka keterlambatan pelajar SMA. Pengamat transportasi menilai program ini perlu ditambah armada pada koridor dengan kenaikan penumpang tertinggi agar kenyamanan tetap terjaga.',
    stimulusTableData: {
      headers: ['Koridor Rute', 'Penumpang/Hari (Bulan 1)', 'Penumpang/Hari (Bulan 3)', 'Tingkat Keterisian'],
      rows: [
        ['Koridor Barat', '420 siswa', '630 siswa', '98% (Sangat Padat)'],
        ['Koridor Tengah', '500 siswa', '540 siswa', '80% (Ideal)'],
        ['Koridor Timur', '300 siswa', '450 siswa', '75% (Ideal)']
      ]
    },
    questionText: 'Tentukan apakah setiap pernyataan berikut BENAR atau SALAH berdasarkan teks dan tabel!',
    statements: [
      { id: 's1', text: 'Koridor Barat mengalami kenaikan jumlah penumpang sebesar 50% dari Bulan 1 ke Bulan 3.' },
      { id: 's2', text: 'Koridor Barat merupakan rute yang paling mendesak memperoleh tambahan armada berdasarkan rekomendasi pengamat.' },
      { id: 's3', text: 'Jumlah penumpang harian tertinggi pada Bulan 1 maupun Bulan 3 sama-sama terjadi di Koridor Tengah.' },
      { id: 's4', text: 'Seluruh koridor pada Bulan 3 telah melampaui kapasitas padat di atas 90%.' },
      { id: 's5', text: 'Total penumpang harian seluruh koridor pada Bulan 3 mencapai 1.620 siswa.' }
    ],
    correctAnswer: { s1: true, s2: true, s3: false, s4: false, s5: true },
    explanation:
      's1 Benar: Koridor Barat naik dari 420 ke 630 (+210 = 50% dari 420). s2 Benar: tingkat keterisian 98% dan naik 50% (sama dengan Koridor Timur 50%, tetapi Koridor Barat sudah sangat padat 98%). s3 Salah: pada Bulan 3 tertinggi adalah Koridor Barat (630 > 540). s4 Salah: Tengah 80% dan Timur 75%. s5 Benar: 630 + 540 + 450 = 1.620 siswa.',
    keyTakeaway: 'Cocokkan selalu klaim kualitatif pengamat pada teks dengan data persentase pada tabel stimulus.'
  },
  {
    id: 'sma11-bind-6',
    grade: '11 SMA',
    subject: 'Bahasa Indonesia',
    questionFormat: 'TKA SMA Terbaru',
    topic: 'Pemaknaan Puisi Kontemporer (Fase F)',
    cognitiveLevel: 'Penalaran',
    type: 'single_choice',
    stimulusTitle: 'Elegi Hutan Kaca',
    stimulusType: 'text',
    stimulusContent:
      'Di kota yang menumbuhkan menara lebih cepat daripada tunas beringin,\nawan-awan belajar batuk menghirup asap kendaraan,\nsedang sungai kehilangan cerminnya di balik tembok beton.\nNamun di celah trotoar yang retak,\nsebatang rumput liar masih menyalakan lentera hijau kecil bagi esok pagi.',
    questionText: 'Makna simbolis larik penutup "sebatang rumput liar masih menyalakan lentera hijau kecil bagi esok pagi" dalam puisi di atas adalah...',
    options: [
      { id: 'A', text: 'Tanaman liar merusak keindahan trotoar kota sehingga harus segera dibersihkan.' },
      { id: 'B', text: 'Harapan akan pemulihan ekologi dan kehidupan tetap bertahan di tengah himpitan krisis lingkungan perkotaan.' },
      { id: 'C', text: 'Lampu jalanan di kota digantikan oleh penerangan alami dari hutan belantara.' },
      { id: 'D', text: 'Pembangunan menara kaca telah berhasil menyejahterakan seluruh penghuni sungai.' },
      { id: 'E', text: 'Kota besar tidak membutuhkan pepohonan selama lampu jalan tetap menyala.' }
    ],
    correctAnswer: 'B',
    explanation:
      'Tiga larik awal melukiskan kerusakan ekologis kota (menara beton, polusi, sungai tercemar). Larik terakhir menghadirkan kontras ("Namun") lewat simbol "rumput liar" dan "lentera hijau" yang melambangkan secercah harapan pemulihan alam di masa depan.',
    keyTakeaway: 'Perhatikan kata hubung kontras ("namun") dan diksi metaforis untuk menangkap pesan inti puisi modern.'
  },
  {
    id: 'sma11-bind-7',
    grade: '11 SMA',
    subject: 'Bahasa Indonesia',
    questionFormat: 'TKA SMA Terbaru',
    topic: 'Teks Ulasan / Resensi Kritis',
    cognitiveLevel: 'Evaluasi & Refleksi',
    type: 'multiple_choice',
    stimulusTitle: 'Ulasan Film Dokumenter "Suara dari Muara"',
    stimulusType: 'text',
    stimulusContent:
      'Film dokumenter berdurasi 52 menit karya komunitas sineas muda ini merekam keseharian nelayan tradisional menghadapi perubahan arus laut dan abrasi pantai. Kekuatan utama film terletak pada sinematografi alami saat fajar serta wawancara jujur tanpa narasi yang menggurui, sehingga emosi penonton terbangun secara organik. Sayangnya, ketiadaan grafik peta pergerakan garis pantai selama dua dekade terakhir membuat penonton awam agak kesulitan membayangkan skala luas wilayah yang terdampak. Selain itu, tata suara pada adegan perahu bermotor sesekali menenggelamkan dialog tokoh.',
    stimulusNote: 'Pilih DUA pernyataan yang mencerminkan evaluasi seimbang (kelebihan & kekurangan) sesuai teks ulasan.',
    questionText: 'Manakah dua simpulan evaluasi yang tepat mengenai film dokumenter "Suara dari Muara"?',
    options: [
      { id: 'A', text: 'Film ini terlalu banyak menampilkan grafik peta sehingga terasa seperti kuliah geografi.' },
      { id: 'B', text: 'Penyajian wawancara autentik tanpa narasi menggurui menjadi daya tarik emosional utama film.' },
      { id: 'C', text: 'Kualitas audio mesin perahu yang mendominasi dialog serta minimnya visualisasi peta menjadi catatan perbaikan teknis.' },
      { id: 'D', text: 'Durasi 52 menit dinilai gagal menangkap sudut pandang nelayan tradisional sama sekali.' },
      { id: 'E', text: 'Narasinya yang panjang dan menggurui membuat film ini terasa mudah dipahami oleh penonton awam.' }
    ],
    correctAnswer: ['B', 'C'],
    explanation:
      'B merangkum keunggulan film yang disebut di kalimat ke-2. C merangkum dua kelemahan teknis yang dicatat pengulas (absennya grafik peta dan tata suara perahu yang menenggelamkan dialog).',
    keyTakeaway: 'Teks ulasan yang objektif menilai aspek estetika dan teknis baik dari sisi keunggulan maupun kelemahan.'
  },

  // =========================================================================
  // KELAS 11 SMA (FASE F KURIKULUM MERDEKA) - BAHASA INGGRIS (7 Soal)
  // 4 Soal Reguler Kurikulum Merdeka + 3 Soal Model TKA SMA Terbaru
  // =========================================================================
  {
    id: 'sma11-bing-1',
    grade: '11 SMA',
    subject: 'Bahasa Inggris',
    questionFormat: 'Reguler Kurikulum Merdeka',
    topic: 'Narrative Text (Moral & Conflict)',
    cognitiveLevel: 'Pemahaman',
    type: 'single_choice',
    stimulusTitle: 'The Weaver’s Unfinished Loom',
    stimulusType: 'text',
    stimulusContent:
      'In a coastal village, a young weaver named Sari wanted to finish a royal silk cloth in half the usual time so she could win a prestigious prize. Ignoring her grandmother’s advice to check the tension of every thread, Sari rushed through the night. On the morning of the exhibition, the intricate gold pattern looked dazzling from afar, yet when the judge gently lifted the fabric, the loose threads tore along the seam. Sari realized too late that speed without patience ruins even the finest craft.',
    questionText: 'What lesson did Sari learn at the end of the story?',
    options: [
      { id: 'A', text: 'Royal silk should never be exhibited in coastal villages.' },
      { id: 'B', text: 'Judges only evaluate patterns from a long distance.' },
      { id: 'C', text: 'Careful craftsmanship and patience are more valuable than rushing for recognition.' },
      { id: 'D', text: 'Weaving at night automatically destroys gold-colored threads.' },
      { id: 'E', text: 'Grandmothers usually forbid young weavers from entering exhibitions.' }
    ],
    correctAnswer: 'C',
    explanation:
      'Kalimat penutup menegaskan pesan moral cerita: "speed without patience ruins even the finest craft" (ketergesa-gesaan tanpa kesabaran merusak karya terbaik sekalipun).',
    keyTakeaway: 'Dalam Narrative Text Kurikulum Merdeka Fase F, amanat sering tersirat melalui konsekuensi tindakan tokoh utama.'
  },
  {
    id: 'sma11-bing-2',
    grade: '11 SMA',
    subject: 'Bahasa Inggris',
    questionFormat: 'Reguler Kurikulum Merdeka',
    topic: 'Analytical Exposition (Digital Literacy)',
    cognitiveLevel: 'Penerapan',
    type: 'single_choice',
    stimulusTitle: 'Why Media Fact-Checking Belongs in Every High School Curriculum',
    stimulusType: 'text',
    stimulusContent:
      'In an era where viral videos spread within seconds, high school students encounter unverified claims daily. Therefore, integrating media fact-checking into regular classes is no longer optional. First, fact-checking trains students to trace original sources rather than trusting sensational headlines. Consequently, young citizens become less susceptible to financial scams and health misinformation. Moreover, evaluating conflicting reports sharpens analytical writing across all school subjects.',
    questionText: 'Which sentence functions as the writer’s thesis statement?',
    options: [
      { id: 'A', text: 'Integrating media fact-checking into regular classes is no longer optional.' },
      { id: 'B', text: 'Viral videos spread within seconds across social media platforms.' },
      { id: 'C', text: 'Young citizens become less susceptible to financial scams.' },
      { id: 'D', text: 'Evaluating conflicting reports happens only in language classes.' },
      { id: 'E', text: 'Viral headlines are automatically verified by all social media platforms.' }
    ],
    correctAnswer: 'A',
    explanation:
      'Thesis statement dalam Analytical Exposition menyatakan posisi/pendapat utama penulis yang akan didukung oleh argumen "First..., Moreover...". Kalimat ke-2 ("Therefore, integrating media fact-checking into regular classes is no longer optional") adalah posisi utama penulis.',
    keyTakeaway: 'Struktur Analytical Exposition terdiri atas Thesis (posisi), Arguments (alasan logis), dan Reiteration.'
  },
  {
    id: 'sma11-bing-3',
    grade: '11 SMA',
    subject: 'Bahasa Inggris',
    questionFormat: 'Reguler Kurikulum Merdeka',
    topic: 'Hortatory Exposition (Recommendation)',
    cognitiveLevel: 'Penerapan',
    type: 'single_choice',
    stimulusTitle: 'Time to Replace Single-Use Plastic Cups on Campus',
    stimulusType: 'text',
    stimulusContent:
      'Every week, a typical senior high school generates hundreds of single-use plastic beverage cups that rarely get recycled due to food residue. These lightweight cups clog campus drains during heavy rain and slowly break down into microplastics. To address this issue, school administrators should install filtered water refill stations in every corridor, and students ought to carry reusable tumblers as part of daily school gear.',
    questionText: 'What distinguishes the final sentence of the passage as a Hortatory Exposition?',
    options: [
      { id: 'A', text: 'It narrates a past personal memory during heavy rain.' },
      { id: 'B', text: 'It defines the chemical structure of microplastics objectively.' },
      { id: 'C', text: 'It only summarizes the topic without suggesting any action.' },
      { id: 'D', text: 'It uses persuasive modals ("should", "ought to") to urge concrete action from readers.' },
      { id: 'E', text: 'It compares tumbler prices across three senior high school cafeterias.' }
    ],
    correctAnswer: 'D',
    explanation:
      'Ciri khas penutup Hortatory Exposition (Fase F) adalah bagian Recommendation yang mengajak/menyarankan tindakan konkret menggunakan modal seperti "should" dan "ought to".',
    keyTakeaway: 'Berbeda dengan Analytical Exposition (Reiteration), Hortatory Exposition ditutup dengan Recommendation (ajakan bertindak).'
  },
  {
    id: 'sma11-bing-4',
    grade: '11 SMA',
    subject: 'Bahasa Inggris',
    questionFormat: 'Reguler Kurikulum Merdeka',
    topic: 'Vocabulary in Context & Writer’s Tone',
    cognitiveLevel: 'Pemahaman',
    type: 'single_choice',
    stimulusTitle: 'Balancing Extracurricular Projects and Academic Focus',
    stimulusType: 'text',
    stimulusContent:
      'Joining five student clubs simultaneously may look impressive on paper, yet spreading yourself too thin often leads to burnout and superficial involvement. Rather than chasing quantity, students thrive when they commit deeply to one or two meaningful projects that align with their genuine curiosity. Sustainable growth requires deliberate pacing, not frantic multitasking.',
    questionText: 'What does the idiomatic phrase "spreading yourself too thin" mean in the context of the passage?',
    options: [
      { id: 'A', text: 'Eating smaller meals to stay healthy during exam weeks' },
      { id: 'B', text: 'Taking on too many commitments at once so none receive adequate focus' },
      { id: 'C', text: 'Sharing school project notes evenly with all club members' },
      { id: 'D', text: 'Focusing deeply on only one meaningful extracurricular club' },
      { id: 'E', text: 'Designing event posters with very narrow paper margins' }
    ],
    correctAnswer: 'B',
    explanation:
      'Frasa "spreading yourself too thin" dijelaskan konteks kalimat sekitarnya: mengikuti lima klub sekaligus menyebabkan burnout dan keterlibatan dangkal (superficial involvement), yakni terlalu banyak komitmen sehingga tidak fokus.',
    keyTakeaway: 'Gunakan petunjuk konteks (context clues) sebelum dan sesudah idiom untuk menafsirkan makna tepat.'
  },
  {
    id: 'sma11-bing-5',
    grade: '11 SMA',
    subject: 'Bahasa Inggris',
    questionFormat: 'TKA SMA Terbaru',
    topic: 'Data Interpretation: Sleep & Academic Focus',
    cognitiveLevel: 'Interpretasi & Integrasi',
    type: 'multiple_choice',
    stimulusTitle: 'Survey on Weekday Sleep Duration and Morning Class Alertness',
    stimulusType: 'table',
    stimulusContent:
      'A student wellness team surveyed 200 eleventh graders regarding their average weekday sleep duration and self-reported concentration during the first two morning lessons.',
    stimulusTableData: {
      headers: ['Sleep Duration Group', 'Number of Students', 'High Morning Alertness (%)', 'Late-Night Screen Use > 1h (%)'],
      rows: [
        ['7 - 8 hours', '60 students', '85%', '15%'],
        ['5.5 - 6.5 hours', '90 students', '52%', '60%'],
        ['Under 5.5 hours', '50 students', '24%', '88%']
      ]
    },
    stimulusNote: 'Pilih DUA kesimpulan berbasis data yang paling tepat (Pilihan Ganda Kompleks TKA SMA).',
    questionText: 'Which TWO conclusions are directly supported by the survey table?',
    options: [
      { id: 'A', text: 'Students sleeping 7–8 hours report more than three times higher morning alertness rates than those sleeping under 5.5 hours.' },
      { id: 'B', text: 'Exactly half of all 200 surveyed students sleep between 7 and 8 hours on weekdays.' },
      { id: 'C', text: 'Using screens late at night guarantees higher morning concentration in class.' },
      { id: 'D', text: 'There is a consistent pattern linking longer late-night screen use with shorter weekday sleep duration.' },
      { id: 'E', text: 'Students sleeping 5.5–6.5 hours represent the smallest group in the entire survey.' }
    ],
    correctAnswer: ['A', 'D'],
    explanation:
      'A benar: 85% dibanding 24% (lebih dari 3 kali lipat, karena 3 × 24% = 72%). D benar: seiring tidur makin singkat (7-8 jam -> 5.5-6.5 jam -> <5.5 jam), persentase penggunaan layar larut malam naik konsisten (15% -> 60% -> 88%). B salah karena 60/200 = 30%, bukan 50%.',
    keyTakeaway: 'Periksa proporsi persentase dan tren antar-kolom pada soal literasi multimodal TKA Bahasa Inggris.'
  },
  {
    id: 'sma11-bing-6',
    grade: '11 SMA',
    subject: 'Bahasa Inggris',
    questionFormat: 'TKA SMA Terbaru',
    topic: 'Comparing Two Letters to the Editor',
    cognitiveLevel: 'Evaluasi & Refleksi',
    type: 'true_false',
    stimulusTitle: 'Reader Letters: AI Tutoring Tools vs. Teacher Mentorship',
    stimulusType: 'text',
    stimulusContent:
      'Letter A (Raka, Grade 11): "24/7 AI math tutors help me review tricky steps at midnight when no teacher is available. Still, the tool never notices when I am discouraged or anxious before an exam."\nLetter B (Ms. Ratna, Senior Teacher): "Digital practice apps offer instant drills, which free up classroom time for deeper project mentoring. However, relying solely on automated feedback risks missing creative problem-solving approaches that diverge from standard templates."',
    questionText: 'Determine whether each statement is TRUE or FALSE based on both letters!',
    statements: [
      { id: 's1', text: 'Raka claims AI tutoring tools are highly effective at detecting student emotional anxiety.' },
      { id: 's2', text: 'Both writers acknowledge practical benefits of digital tools while pointing out distinct limitations.' },
      { id: 's3', text: 'Ms. Ratna worries that automated apps might undervalue unconventional yet creative student solutions.' },
      { id: 's4', text: 'Ms. Ratna wants to ban all digital practice apps from classroom support.' },
      { id: 's5', text: 'Raka finds AI math tutors helpful when he needs late-night review outside school hours.' }
    ],
    correctAnswer: { s1: false, s2: true, s3: true, s4: false, s5: true },
    explanation:
      's1 False (Raka says "never notices when I am discouraged or anxious"). s2 True (Raka notes 24/7 help + emotional limitation; Ms. Ratna notes instant drills + creativity limitation). s3 True ("risks missing creative problem-solving approaches"). s4 False (she notes apps free up classroom time for mentoring). s5 True ("help me review tricky steps at midnight when no teacher is available").',
    keyTakeaway: 'Bandingkan klaim spesifik masing-masing penulis agar tidak terjebak generalisasi berlebih.'
  },
  {
    id: 'sma11-bing-7',
    grade: '11 SMA',
    subject: 'Bahasa Inggris',
    questionFormat: 'TKA SMA Terbaru',
    topic: 'Evaluative Comprehension: Urban Heat Islands',
    cognitiveLevel: 'Penalaran',
    type: 'single_choice',
    stimulusTitle: 'Cooling Dense Cities: Green Rooftops vs. Reflective Paint',
    stimulusType: 'text',
    stimulusContent:
      'Dense concrete rooftops absorb solar radiation all afternoon, raising urban ambient temperatures by up to 4°C—a phenomenon known as the Urban Heat Island effect. Green rooftops planted with native sedum can lower roof surface temperatures significantly and absorb stormwater, though older buildings often cannot bear the extra structural weight of soil and irrigation. Conversely, high-albedo white reflective coatings reflect up to 80% of sunlight and add virtually zero structural load, making them ideal for retrofitting aging school and warehouse roofs.',
    questionText: 'An old three-story community warehouse has weak roof beams that cannot support heavy wet soil, yet needs urgent daytime cooling. Based on the passage, which intervention fits best?',
    options: [
      { id: 'A', text: 'Installing deep soil beds for large shade trees directly on the warehouse roof' },
      { id: 'B', text: 'Demolishing the warehouse to build a stormwater retention pond' },
      { id: 'C', text: 'Applying high-albedo white reflective coatings because they reflect sunlight without adding heavy structural load' },
      { id: 'D', text: 'Installing dark concrete tiles to absorb afternoon solar radiation faster' },
      { id: 'E', text: 'Leaving concrete rooftops untreated while planting heavy indoor gardens inside offices' }
    ],
    correctAnswer: 'C',
    explanation:
      'Teks menyatakan bangunan tua sering tidak kuat menahan beban tanah dan irigasi dari green rooftop, sedangkan "high-albedo white reflective coatings" memantulkan hingga 80% cahaya matahari tanpa menambah beban struktur.',
    keyTakeaway: 'Soal penalaran terapan TKA meminta Anda memilih solusi paling presisi sesuai batasan (constraint) pada kasus.'
  },

  // =========================================================================
  // KELAS 11 SMA (FASE F KURIKULUM MERDEKA) - MATEMATIKA (6 Soal)
  // 3 Soal Reguler Kurikulum Merdeka + 3 Soal Model TKA SMA Terbaru
  // =========================================================================
  {
    id: 'sma11-mat-1',
    grade: '11 SMA',
    subject: 'Matematika',
    questionFormat: 'Reguler Kurikulum Merdeka',
    topic: 'Fungsi Komposisi dan Fungsi Invers',
    cognitiveLevel: 'Penerapan',
    type: 'single_choice',
    stimulusTitle: 'Menentukan Nilai Invers Fungsi Komposisi',
    stimulusType: 'text',
    stimulusContent:
      'Diketahui dua fungsi aljabar linear pada materi Fungsi Komposisi dan Invers Kelas 11 Kurikulum Merdeka yaitu f(x) = 2x + 3 dan g(x) = x - 5.',
    questionText: 'Nilai dari (f ∘ g)⁻¹(9) adalah...',
    options: [
      { id: 'A', text: '4' },
      { id: 'B', text: '6' },
      { id: 'C', text: '8' },
      { id: 'D', text: '11' },
      { id: 'E', text: '12' }
    ],
    correctAnswer: 'C',
    explanation:
      'Tentukan (f ∘ g)(x) = f(g(x)) = 2(x - 5) + 3 = 2x - 7. Misalkan (f ∘ g)⁻¹(9) = k, maka (f ∘ g)(k) = 9 => 2k - 7 = 9 => 2k = 16 => k = 8.',
    keyTakeaway: 'Gunakan sifat invers h⁻¹(y) = x ⇔ h(x) = y untuk mempercepat perhitungan nilai invers pada suatu titik.'
  },
  {
    id: 'sma11-mat-2',
    grade: '11 SMA',
    subject: 'Matematika',
    questionFormat: 'Reguler Kurikulum Merdeka',
    topic: 'Lingkaran: Persamaan Garis Singgung',
    cognitiveLevel: 'Pemahaman',
    type: 'single_choice',
    stimulusTitle: 'Lintasan Singgung Roda Berpusat di Titik Asal',
    stimulusType: 'text',
    stimulusContent:
      'Sebuah lingkaran memiliki pusat di O(0, 0) dan jari-jari 5 satuan dengan persamaan x² + y² = 25. Titik A(3, 4) terletak tepat pada lingkaran tersebut (karena 3² + 4² = 25).',
    questionText: 'Persamaan garis singgung lingkaran tersebut yang melalui titik A(3, 4) adalah...',
    options: [
      { id: 'A', text: '3x + 4y = 25' },
      { id: 'B', text: '4x + 3y = 25' },
      { id: 'C', text: '3x - 4y = 25' },
      { id: 'D', text: '3x + 4y = 5' },
      { id: 'E', text: '4x - 3y = 25' }
    ],
    correctAnswer: 'A',
    explanation:
      'Persamaan garis singgung lingkaran x² + y² = r² di titik singgung (x₁, y₁) pada lingkaran adalah x₁x + y₁y = r². Substitusi (3, 4) dan r² = 25 menghasilkan 3x + 4y = 25.',
    keyTakeaway: 'Untuk titik pada lingkaran x² + y² = r², terapkan kaidah bagi adil: x₁x + y₁y = r².'
  },
  {
    id: 'sma11-mat-3',
    grade: '11 SMA',
    subject: 'Matematika',
    questionFormat: 'Reguler Kurikulum Merdeka',
    topic: 'Transformasi Geometri (Translasi & Refleksi)',
    cognitiveLevel: 'Penerapan',
    type: 'single_choice',
    stimulusTitle: 'Pergerakan Objek Animasi pada Bidang Koordinat',
    stimulusType: 'text',
    stimulusContent:
      'Dalam proyek desain grafis koordinat Kartesius, sebuah titik kendali berada di posisi P(4, -2). Titik P digeser oleh translasi T = (3, 5) hingga tiba di P′, lalu dicerminkan terhadap sumbu-X sehingga menghasilkan bayangan akhir P″.',
    questionText: 'Koordinat bayangan akhir P″ adalah...',
    options: [
      { id: 'A', text: '(-7, 3)' },
      { id: 'B', text: '(7, -3)' },
      { id: 'C', text: '(-7, -3)' },
      { id: 'D', text: '(3, 7)' },
      { id: 'E', text: '(7, 3)' }
    ],
    correctAnswer: 'B',
    explanation:
      'Langkah 1 (Translasi): P′ = (4 + 3, -2 + 5) = (7, 3). Langkah 2 (Refleksi terhadap sumbu-X mengubah (x, y) menjadi (x, -y)): P″ = (7, -3).',
    keyTakeaway: 'Pada refleksi terhadap sumbu-X, absis (x) tetap dan ordinat (y) berubah tanda menjadi -y.'
  },
  {
    id: 'sma11-mat-4',
    grade: '11 SMA',
    subject: 'Matematika',
    questionFormat: 'TKA SMA Terbaru',
    topic: 'Matematika Keuangan: Bunga Majemuk',
    cognitiveLevel: 'Penalaran',
    type: 'multiple_choice',
    stimulusTitle: 'Perencanaan Dana Pendidikan Siswa Kelas 11',
    stimulusType: 'text',
    stimulusContent:
      'Orang tua Dika menempatkan dana awal sebesar Rp5.000.000 pada instrumen tabungan pendidikan dengan sistem bunga majemuk 10% per tahun (tanpa setoran tambahan maupun biaya admin). Sebagai referensi hitung cepat, diketahui 1,1² = 1,21 dan 1,1³ = 1,331.',
    stimulusNote: 'Pilih DUA pernyataan yang bernilai BENAR berdasarkan perhitungan bunga majemuk (MCMA TKA SMA).',
    questionText: 'Pernyataan manakah yang tepat mengenai perkembangan tabungan tersebut?',
    options: [
      { id: 'A', text: 'Saldo tabungan pada akhir tahun ke-1 adalah Rp5.500.000.' },
      { id: 'B', text: 'Saldo tabungan pada akhir tahun ke-2 adalah Rp6.000.000.' },
      { id: 'C', text: 'Total akumulasi bunga yang diperoleh selama 3 tahun penuh adalah Rp1.655.000.' },
      { id: 'D', text: 'Jika memakai bunga tunggal 10% per tahun, saldo akhir tahun ke-3 akan lebih besar daripada bunga majemuk.' },
      { id: 'E', text: 'Bunga yang diperoleh khusus pada tahun ke-3 saja lebih kecil daripada bunga pada tahun ke-1.' }
    ],
    correctAnswer: ['A', 'C'],
    explanation:
      'Rumus bunga majemuk: M_n = M₀(1 + i)^n. Tahun ke-1: 5.000.000 × 1,1 = Rp5.500.000 (A Benar). Tahun ke-2: 5.000.000 × 1,21 = Rp6.050.000 (B Salah). Tahun ke-3: 5.000.000 × 1,331 = Rp6.655.000, sehingga total bunga = 6.655.000 - 5.000.000 = Rp1.655.000 (C Benar). Bunga tunggal 3 tahun hanya 5.000.000 + 3(500.000) = Rp6.500.000 < Rp6.655.000 (D Salah).',
    keyTakeaway: 'Bunga majemuk menghitung bunga secara berbunga pada saldo tahun sebelumnya: M_n = M₀(1 + i)^n.'
  },
  {
    id: 'sma11-mat-5',
    grade: '11 SMA',
    subject: 'Matematika',
    questionFormat: 'TKA SMA Terbaru',
    topic: 'Kombinatorika dan Peluang Kejadian',
    cognitiveLevel: 'Penalaran',
    type: 'true_false',
    stimulusTitle: 'Pemilihan Tim Delegasi Forum Ilmiah Kelas 11',
    stimulusType: 'text',
    stimulusContent:
      'OSIS SMA akan memilih tepat 3 siswa secara acak sebagai tim delegasi forum ilmiah sekolah. Kandidat yang mendaftar terdiri atas 5 siswa dari rumpun IPA dan 4 siswa dari rumpun IPS.',
    questionText: 'Tentukan apakah setiap pernyataan peluang dan kombinatorik berikut BENAR atau SALAH!',
    statements: [
      { id: 's1', text: 'Banyak cara berbeda memilih 3 delegasi dari total 9 kandidat tanpa syarat rumpun adalah 84 cara.' },
      { id: 's2', text: 'Peluang terpilihnya ketiga delegasi seluruhnya berasal dari rumpun IPA adalah 5/42.' },
      { id: 's3', text: 'Banyak cara memilih tepat 2 siswa IPA dan 1 siswa IPS adalah 20 cara.' },
      { id: 's4', text: 'Peluang terpilihnya minimal 1 siswa dari rumpun IPS dalam tim delegasi adalah 35/42.' },
      { id: 's5', text: 'Banyak cara memilih ketiga delegasi seluruhnya berasal dari rumpun IPS adalah 4 cara.' }
    ],
    correctAnswer: { s1: true, s2: true, s3: false, s4: false, s5: true },
    explanation:
      's1 Benar: C(9,3) = (9×8×7)/(3×2×1) = 84. s2 Benar: C(5,3) = 10, sehingga P(3 IPA) = 10/84 = 5/42. s3 Salah: C(5,2) × C(4,1) = 10 × 4 = 40 cara (bukan 20). s4 Salah: P(minimal 1 IPS) = 1 - P(semua IPA) = 1 - 5/42 = 37/42. s5 Benar: C(4,3) = 4 cara.',
    keyTakeaway: 'Gunakan aturan komplemen P(minimal 1) = 1 - P(tidak ada sama sekali) untuk efisiensi soal peluang TKA.'
  },
  {
    id: 'sma11-mat-6',
    grade: '11 SMA',
    subject: 'Matematika',
    questionFormat: 'TKA SMA Terbaru',
    topic: 'Statistika Bivariat & Regresi Linear (Fase F)',
    cognitiveLevel: 'Penalaran',
    type: 'single_choice',
    stimulusTitle: 'Analisis Hubungan Durasi Belajar Mandiri dan Skor Kuis',
    stimulusType: 'text',
    stimulusContent:
      'Dari pencatatan data bivariat kelas 11 Kurikulum Merdeka selama satu semester, diperoleh model garis regresi linear antara durasi belajar mandiri per minggu x (dalam jam, untuk 2 ≤ x ≤ 8) dan prediksi skor kuis ŷ dengan persamaan ŷ = 45 + 6x.',
    questionText: 'Berdasarkan persamaan regresi linear tersebut, selisih prediksi skor antara siswa yang belajar 7 jam per minggu dan siswa yang belajar 4 jam per minggu adalah...',
    options: [
      { id: 'A', text: '6 poin' },
      { id: 'B', text: '12 poin' },
      { id: 'C', text: '18 poin' },
      { id: 'D', text: '24 poin' },
      { id: 'E', text: '30 poin' }
    ],
    correctAnswer: 'C',
    explanation:
      'Untuk x = 7: ŷ = 45 + 6(7) = 87. Untuk x = 4: ŷ = 45 + 6(4) = 69. Selisihnya = 87 - 69 = 18 poin (setiap kenaikan 1 jam menambah prediksi skor sebesar gradien b = 6, sehingga selisih 3 jam = 3 × 6 = 18 poin).',
    keyTakeaway: 'Pada regresi linear ŷ = a + bx, koefisien b menyatakan perubahan rata-rata y untuk setiap penambahan 1 satuan x.'
  }
];

export const getQuestionsByGrade = (grade: GradeLevel): Question[] => {
  return QUESTIONS.filter(q => q.grade === grade);
};
