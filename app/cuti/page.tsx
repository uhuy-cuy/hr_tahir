"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import Swal from "sweetalert2"
import { FiArrowLeft } from "react-icons/fi"
import withReactContent from "sweetalert2-react-content"

interface Cuti {
    id_cuti: number
    tanggal_mulai: string
    tanggal_selesai: string
    jenis_cuti: string
    alasan: string
    status: string
}

const MySwal = withReactContent(Swal)

export default function AjukanCuti() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [form, setForm] = useState({
        tanggal_mulai: "",
        tanggal_selesai: "",
        jenis_cuti: "tahunan",
        alasan: "",
    })
    const [loading, setLoading] = useState(false)
    const [loadingData, setLoadingData] = useState(false) // <-- loading untuk fetch awal
    const [cutiList, setCutiList] = useState<Cuti[]>([])
    const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null])
    const [startDate, endDate] = dateRange

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

        if (userData) setUser(JSON.parse(userData))

        fetchCutis(token, userData ? JSON.parse(userData).id_karyawan : null)
    }, [])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    const fetchCutis = async (token: string, id_karyawan: number | null) => {
        if (!id_karyawan) return;
        setLoadingData(true);

        try {
            const res = await fetch(`http://127.0.0.1:8000/api/cutis/${id_karyawan}`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
            });

            if (!res.ok) throw new Error("Gagal fetch data cuti");

            const data = await res.json();
            setCutiList(data); // sudah pasti sesuai id_karyawan
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingData(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const token = localStorage.getItem("token")
        if (!token || !user) {
            MySwal.fire({
                icon: "error",
                title: "Oops...",
                text: "User tidak ditemukan atau token hilang",
            })
            setLoading(false)
            return
        }

        try {
            const res = await fetch("http://127.0.0.1:8000/api/cutis", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    id_karyawan: user.id_karyawan,
                    tanggal_mulai: form.tanggal_mulai,
                    tanggal_selesai: form.tanggal_selesai,
                    jenis_cuti: form.jenis_cuti,
                    alasan: form.alasan,
                }),
            })

            if (!res.ok) {
                const errData = await res.json()
                throw new Error(errData.message || "Gagal mengajukan cuti")
            }

            MySwal.fire({
                icon: "success",
                title: "Berhasil!",
                text: "Cuti berhasil diajukan!",
                timer: 2000,
                showConfirmButton: false,
            })

            setForm({
                tanggal_mulai: "",
                tanggal_selesai: "",
                jenis_cuti: "tahunan",
                alasan: "",
            })
            setDateRange([null, null])

            fetchCutis(token, user.id_karyawan)
        } catch (err: any) {
            MySwal.fire({
                icon: "error",
                title: "Oops...",
                text: err.message || "Gagal mengajukan cuti",
            })
        } finally {
            setLoading(false)
        }
    }

    const handleBatalCuti = async (id_cuti: number) => {
        const result = await MySwal.fire({
            icon: "warning",
            title: "Konfirmasi",
            text: "Apakah Anda yakin ingin membatalkan cuti ini?",
            showCancelButton: true,
            confirmButtonText: "Ya, batalkan",
            cancelButtonText: "Batal",
        })

        if (result.isConfirmed) {
            const token = localStorage.getItem("token")
            if (!token) return

            try {
                const res = await fetch(`http://127.0.0.1:8000/api/cutis/${id_cuti}`, {
                    method: "DELETE",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                    },
                })

                if (!res.ok) {
                    const errData = await res.json()
                    throw new Error(errData.message || "Gagal membatalkan cuti")
                }

                MySwal.fire({
                    icon: "success",
                    title: "Berhasil",
                    text: "Cuti berhasil dibatalkan",
                    timer: 2000,
                    showConfirmButton: false,
                })

                if (user) fetchCutis(token, user.id_karyawan)
            } catch (err: any) {
                MySwal.fire({
                    icon: "error",
                    title: "Oops...",
                    text: err.message || "Gagal membatalkan cuti",
                })
            }
        }
    }

    return (
        <div className="min-h-screen bg-gray-100 p-6 md:p-10">
            <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-2xl p-8">

                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Ajukan Cuti</h1>
                    <button
                        onClick={() => router.back()}
                        className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition font-semibold cursor-pointer"
                    >
                        <FiArrowLeft size={20} />
                    </button>
                </div>

                {/* Form Cuti */}
                <form onSubmit={handleSubmit} className="space-y-4 mb-8">

                    <div>
                        <label className="block text-gray-700 mb-1">Tanggal</label>
                        <DatePicker
                            selectsRange
                            startDate={startDate}
                            endDate={endDate}
                            onChange={(update: [Date | null, Date | null]) => {
                                setDateRange(update)
                                setForm({
                                    ...form,
                                    tanggal_mulai: update[0] ? update[0].toISOString().split("T")[0] : "",
                                    tanggal_selesai: update[1] ? update[1].toISOString().split("T")[0] : "",
                                })
                            }}
                            isClearable={true}
                            className="w-full border p-2 rounded-lg text-black"
                            placeholderText="Pilih tanggal mulai dan selesai"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-700 mb-1">Jenis Cuti</label>
                        <select
                            name="jenis_cuti"
                            value={form.jenis_cuti}
                            onChange={handleChange}
                            className="w-full border p-2 rounded-lg text-black"
                        >
                            <option value="tahunan">Tahunan</option>
                            <option value="sakit">Sakit</option>
                            <option value="khusus">Khusus</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-gray-700 mb-1">Alasan</label>
                        <textarea
                            name="alasan"
                            value={form.alasan}
                            onChange={handleChange}
                            className="w-full border p-2 rounded-lg text-black"
                            rows={3}
                        ></textarea>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition font-semibold cursor-pointer"
                    >
                        {loading ? "Mengirim..." : "Ajukan Cuti"}
                    </button>

                </form>

                {/* Table Cuti */}
                <div className="overflow-x-auto">
                    {loadingData ? (
                        <div className="text-center p-6 text-gray-500">Loading data...</div>
                    ) : (
                        <table className="w-full border-collapse shadow rounded-lg">
                            <thead>
                                <tr className="bg-gray-800 text-white text-sm uppercase tracking-wider">
                                    <th className="p-3 text-left">Tanggal Mulai</th>
                                    <th className="p-3 text-left">Tanggal Selesai</th>
                                    <th className="p-3 text-left">Jenis</th>
                                    <th className="p-3 text-left">Alasan</th>
                                    <th className="p-3 text-left">Status</th>
                                    <th className="p-3 text-left">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cutiList.length > 0 ? (
                                    cutiList.map(cuti => (
                                        <tr key={cuti.id_cuti} className="bg-gray-50 hover:bg-blue-50 transition">
                                            <td className="p-3 text-black">{cuti.tanggal_mulai}</td>
                                            <td className="p-3 text-black">{cuti.tanggal_selesai}</td>
                                            <td className="p-3 text-black capitalize">{cuti.jenis_cuti}</td>
                                            <td className="p-3 text-black">{cuti.alasan || "-"}</td>
                                            <td className="p-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${cuti.status === "disetujui"
                                                    ? "bg-green-100 text-green-700"
                                                    : cuti.status === "ditolak"
                                                        ? "bg-red-100 text-red-700"
                                                        : "bg-yellow-100 text-yellow-700"
                                                    }`}>
                                                    {cuti.status}
                                                </span>
                                            </td>
                                            <td className="p-3">
                                                <button
                                                    onClick={() => handleBatalCuti(cuti.id_cuti)}
                                                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition text-sm cursor-pointer"
                                                >
                                                    Batal Cuti
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="p-3 text-center text-gray-500">Belum ada pengajuan cuti</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

            </div>
        </div>
    )
}
