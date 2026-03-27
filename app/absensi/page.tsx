"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Swal from "sweetalert2"
import { FiArrowLeft } from "react-icons/fi"

interface Absensi {
    id_absensi: number
    tanggal: string
    jam_masuk: string | null
    jam_keluar: string | null
    status: "hadir" | "izin" | "sakit" | "alpha"
}

interface Cuti {
    id_cuti: number
    id_karyawan: number
    tanggal_mulai: string
    tanggal_selesai: string
    jenis_cuti: string
    alasan: string
    status: string
}

export default function Absensi() {
    const router = useRouter()
    const [user, setUser] = useState<{ id_karyawan: number; name: string } | null>(null)
    const [absensiHariIni, setAbsensiHariIni] = useState<Absensi | null>(null)
    const [riwayat, setRiwayat] = useState<Absensi[]>([])
    const [cutiList, setCutiList] = useState<Cuti[]>([])
    const [loading, setLoading] = useState(true)

    const today = new Date().toISOString().slice(0, 10)

    useEffect(() => {
        const token = localStorage.getItem("token")
        const userData = localStorage.getItem("user")

        if (!token) {
            router.push("/login")
            return
        }
         // ✅ TAMBAHAN: cek expired token
        try {
            const payload = JSON.parse(atob(token.split(".")[1]))
            const now = Date.now() / 1000

            if (payload.exp < now) {
                localStorage.clear()

                Swal.fire({
                    icon: "warning",
                    title: "Session Habis",
                    text: "Silakan login kembali"
                }).then(() => {
                    router.push("/login")
                })

                return
            }
        } catch (err) {
            localStorage.clear()

            Swal.fire({
                icon: "error",
                title: "Token Tidak Valid",
                text: "Silakan login ulang"
            }).then(() => {
                router.push("/login")
            })

            return
        }

        if (userData) {
            const parsedUser = JSON.parse(userData)
            const { id_karyawan, name } = parsedUser
            setUser({ id_karyawan, name })
            fetchAbsensi(id_karyawan)
            fetchCutis(token, id_karyawan)
        }
    }, [])

    // Fetch absensi
    const fetchAbsensi = async (id_karyawan: number) => {
        setLoading(true)
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/absensis/user/${id_karyawan}`, {
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`,
                    "Accept": "application/json"
                }
            })
            if (!res.ok) throw new Error("Gagal mengambil data absensi")
            const data = await res.json()
            setAbsensiHariIni(data.hariIni)
            setRiwayat(data.riwayat)
        } catch (err: any) {
            console.error(err)
            setAbsensiHariIni(null)
            setRiwayat([])
        } finally {
            setLoading(false)
        }
    }

    // Fetch cuti sesuai id_karyawan langsung dari API
    const fetchCutis = async (token: string, id_karyawan: number) => {
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/cutis/${id_karyawan}`, {
                headers: { "Authorization": `Bearer ${token}` }
            })

            if (!res.ok) throw new Error("Gagal fetch data cuti")

            const data: Cuti[] = await res.json()
            setCutiList(data) // data sudah pasti sesuai id_karyawan
        } catch (err) {
            console.error(err)
        }
    }

    // Cek cuti hari ini
    const isHariIniCuti = (): boolean => {
        return cutiList.some(
            cuti =>
                cuti.status === "disetujui" &&
                today >= cuti.tanggal_mulai &&
                today <= cuti.tanggal_selesai
        )
    }

    // Ambil cuti aktif (hari ini atau masa depan)
    const getActiveCuti = (): Cuti[] => {
        return cutiList.filter(
            cuti =>
                cuti.status === "disetujui" &&
                cuti.tanggal_selesai >= today
        ).sort((a, b) => new Date(a.tanggal_mulai).getTime() - new Date(b.tanggal_mulai).getTime())
    }

    // Handle presensi
    const handlePresensi = async (type: "masuk" | "keluar") => {
        if (!user) return

        if (isHariIniCuti()) {
            Swal.fire("Info", "Hari ini kamu sedang cuti, tidak bisa presensi.", "info")
            return
        }

        try {
            let url = ""
            let method: "POST" | "PUT" = "POST"
            let payload: any = {}

            if (type === "masuk") {
                if (absensiHariIni) {
                    Swal.fire("Info", "Kamu sudah presensi masuk hari ini.", "info")
                    return
                }
                url = `http://127.0.0.1:8000/api/absensis`
                payload = {
                    id_karyawan: user.id_karyawan,
                    tanggal: today,
                    jam_masuk: new Date().toLocaleTimeString("en-GB"),
                    status: "hadir"
                }
            } else {
                if (!absensiHariIni) {
                    Swal.fire("Info", "Kamu belum presensi masuk hari ini.", "info")
                    return
                }
                if (absensiHariIni.jam_keluar) {
                    Swal.fire("Info", "Kamu sudah presensi keluar hari ini.", "info")
                    return
                }
                url = `http://127.0.0.1:8000/api/absensis/${absensiHariIni.id_absensi}`
                method = "PUT"
                payload = { jam_keluar: new Date().toLocaleTimeString("en-GB") }
            }

            const res = await fetch(url, {
                method,
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.message || "Gagal presensi")
            Swal.fire(
                "Sukses",
                data.message || `${type === "masuk" ? "Presensi masuk" : "Presensi keluar"} berhasil`,
                "success"
            )
            fetchAbsensi(user.id_karyawan)
        } catch (err: any) {
            Swal.fire("Gagal", err.message || "Terjadi kesalahan", "error")
        }
    }

    const activeCutis = getActiveCuti()
    const cutiHariIni = activeCutis.find(cuti => today >= cuti.tanggal_mulai && today <= cuti.tanggal_selesai)

    return (
        <div className="min-h-screen bg-gray-100 p-6 md:p-10 relative">
            {/* Overlay Loading */}
            {loading && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
                    <div className="text-white text-lg font-semibold animate-pulse">
                        Loading data...
                    </div>
                </div>
            )}
            {/* Note Cutinya */}
            {cutiHariIni && (
                <div className="absolute top-4 right-4 bg-red-100 border border-red-300 text-red-800 px-4 py-2 rounded-lg shadow-md text-sm font-semibold max-w-xs text-right">
                    Hari ini Anda sedang cuti: <span className="capitalize">{cutiHariIni.jenis_cuti}</span> <br />
                    ({cutiHariIni.tanggal_mulai} s/d {cutiHariIni.tanggal_selesai})
                </div>
            )}

            <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-2xl p-6">   <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold mb-6 text-gray-800">Absensi</h1>

                <button
                    onClick={() => router.back()}
                    className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition font-semibold cursor-pointer"
                >
                    <FiArrowLeft size={20} />
                </button>
            </div>
                {user && <p className="mb-6 text-gray-700">Halo, <b>{user.name}</b>! Berikut absensi kamu hari ini.</p>}


                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    {/* Presensi Masuk */}
                    <button
                        disabled={!!absensiHariIni?.jam_masuk || absensiHariIni?.status === "izin" || isHariIniCuti()}
                        onClick={() => handlePresensi("masuk")}
                        className={`w-full sm:w-auto px-6 py-3 rounded-lg font-semibold transition ${absensiHariIni?.jam_masuk || absensiHariIni?.status === "izin" || isHariIniCuti()
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-green-500 hover:bg-green-600 text-white cursor-pointer"
                            }`}
                    >
                        {absensiHariIni?.jam_masuk ? `Masuk: ${absensiHariIni.jam_masuk}` : "Presensi Masuk"}
                    </button>

                    {/* Presensi Keluar */}
                    <button
                        disabled={!absensiHariIni?.jam_masuk || !!absensiHariIni?.jam_keluar || absensiHariIni?.status === "izin" || isHariIniCuti()}
                        onClick={() => handlePresensi("keluar")}
                        className={`w-full sm:w-auto px-6 py-3 rounded-lg font-semibold transition ${!absensiHariIni?.jam_masuk || absensiHariIni?.jam_keluar || absensiHariIni?.status === "izin" || isHariIniCuti()
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-red-500 hover:bg-red-600 text-white cursor-pointer"
                            }`}
                    >
                        {absensiHariIni?.jam_keluar ? `Keluar: ${absensiHariIni.jam_keluar}` : "Presensi Keluar"}
                    </button>

                    {/* Ajukan Izin */}
                    <button
                        disabled={!!absensiHariIni || absensiHariIni?.status === "izin" || isHariIniCuti()}
                        onClick={async () => {
                            if (!user) return

                            // Tampilkan konfirmasi
                            const result = await Swal.fire({
                                title: "Konfirmasi",
                                text: "Apakah Anda yakin ingin izin hari ini?",
                                icon: "question",
                                showCancelButton: true,
                                confirmButtonText: "Ya",
                                cancelButtonText: "Batal",
                            });

                            if (!result.isConfirmed) return; // jika batal, hentikan

                            try {
                                const res = await fetch(`http://127.0.0.1:8000/api/absensis`, {
                                    method: "POST",
                                    headers: {
                                        "Authorization": `Bearer ${localStorage.getItem("token")}`,
                                        "Content-Type": "application/json"
                                    },
                                    body: JSON.stringify({
                                        id_karyawan: user.id_karyawan,
                                        tanggal: today,
                                        jam_masuk: null,
                                        jam_keluar: null,
                                        status: "izin"
                                    })
                                });
                                const data = await res.json();
                                if (!res.ok) throw new Error(data.message || "Gagal mengajukan izin");
                                Swal.fire("Sukses", "Izin hari ini berhasil diajukan", "success");
                                fetchAbsensi(user.id_karyawan);
                            } catch (err: any) {
                                Swal.fire("Gagal", err.message || "Terjadi kesalahan", "error");
                            }
                        }}
                        className={`w-full sm:w-auto px-6 py-3 rounded-lg font-semibold transition ${!!absensiHariIni || absensiHariIni?.status === "izin" || isHariIniCuti()
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-yellow-500 hover:bg-yellow-600 text-white cursor-pointer"
                            }`}
                    >
                        Ajukan Izin
                    </button>
                </div>

                {/* Riwayat Absensi */}
                <div>
                    <h2 className="text-xl font-bold mb-4 text-gray-800">Riwayat Absensi</h2>
                    {riwayat.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse shadow-md rounded-lg overflow-hidden">
                                <thead>
                                    <tr className="bg-gray-800 text-white text-sm uppercase tracking-wider">
                                        <th className="p-3 text-left">Tanggal</th>
                                        <th className="p-3 text-left">Jam Masuk</th>
                                        <th className="p-3 text-left">Jam Keluar</th>
                                        <th className="p-3 text-left">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {riwayat
                                        .slice()
                                        .sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime())
                                        .map((r) => (
                                            <tr key={r.id_absensi} className="bg-gray-50 hover:bg-blue-50 transition">
                                                <td className="p-3 text-black">{r.tanggal}</td>
                                                <td className="p-3 text-black">{r.jam_masuk ?? "-"}</td>
                                                <td className="p-3 text-black">{r.jam_keluar ?? "-"}</td>
                                                <td className="p-3 capitalize">
                                                    <span
                                                        className={`px-2 py-1 rounded-full text-xs font-semibold ${r.status === "hadir"
                                                            ? "bg-green-100 text-green-700"
                                                            : r.status === "izin"
                                                                ? "bg-yellow-100 text-yellow-700"
                                                                : r.status === "sakit"
                                                                    ? "bg-red-100 text-red-700"
                                                                    : "bg-gray-100 text-gray-700"
                                                            }`}
                                                    >
                                                        {r.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-gray-500">Belum ada absensi.</p>
                    )}
                </div>
            </div>
        </div>
    )
}
