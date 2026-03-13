"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Swal from "sweetalert2"
import withReactContent from "sweetalert2-react-content"
import { checkAdminAccess } from "@/lib/authGuard"
import { FiArrowLeft } from "react-icons/fi"


interface Cuti {
    id_cuti: number
    id_karyawan: number
    tanggal_mulai: string
    tanggal_selesai: string
    jenis_cuti: string
    alasan: string
    status: string
}

interface Karyawan {
    id_karyawan: number
    nama: string
}

const MySwal = withReactContent(Swal)

export default function PersetujuanCuti() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [cutiList, setCutiList] = useState<Cuti[]>([])
    const [karyawanData, setKaryawanData] = useState<Karyawan[]>([])
    const [loading, setLoading] = useState(true) // gabungkan semua fetch
    const [error, setError] = useState<string | null>(null)
    const [search, setSearch] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 5

    useEffect(() => {
        const token = localStorage.getItem("token")
        const userData = localStorage.getItem("user")

        if (!token) {
            router.push("/login")
            return
        }

        // if (userData) setUser(JSON.parse(userData))
        if (userData) {
            const parsedUser = JSON.parse(userData)
            console.log("User parsed di useEffect:", parsedUser)
            setUser(parsedUser)
        }

        fetchData(token)
        if (!checkAdminAccess(router)) return
    }, [])
    const fetchData = async (token: string) => {
        setLoading(true)
        setError(null)
        try {
            // fetch karyawan dan cuti sekaligus
            const [karyawanRes, cutiRes] = await Promise.all([
                fetch("http://127.0.0.1:8000/api/karyawans", { headers: { "Authorization": `Bearer ${token}` } }),
                fetch("http://127.0.0.1:8000/api/cutis", { headers: { "Authorization": `Bearer ${token}` } })
            ])

            if (!karyawanRes.ok) throw new Error("Gagal fetch data karyawan")
            if (!cutiRes.ok) throw new Error("Gagal fetch data cuti")

            const karyawanData = await karyawanRes.json()
            const cutiData = await cutiRes.json()

            setKaryawanData(karyawanData)
            setCutiList(cutiData)
        } catch (err: any) {
            console.error(err)
            setError(err.message || "Terjadi kesalahan saat memuat data")
        } finally {
            setLoading(false)
        }
    }

    const handleStatusChange = async (id_cuti: number, status: string) => {
        const token = localStorage.getItem("token")
        if (!token || !user) {
            console.log("Token atau user tidak tersedia saat approve")
            return
        }

        console.log("User saat approve:", user)

        setLoading(true)
        try {
            const payload: any = {
                status,
                approved_at: new Date().toLocaleString("sv-SE").replace("T", " "),
                approved_by: user.id_karyawan,
            }
            console.log("Payload sebelum fetch:", payload)

            const res = await fetch(`http://127.0.0.1:8000/api/cutis/${id_cuti}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            })

            if (!res.ok) {
                const contentType = res.headers.get("content-type")
                let errMessage = "Gagal update status cuti"

                if (contentType && contentType.includes("application/json")) {
                    const errData = await res.json()
                    errMessage = errData.message || errMessage
                } else {
                    const text = await res.text()
                    console.error("Response bukan JSON:", text)
                }

                throw new Error(errMessage)
            }

            MySwal.fire({
                icon: "success",
                title: "Berhasil",
                text: `Cuti berhasil diubah menjadi "${status}"`,
                timer: 1500,
                showConfirmButton: false,
            })

            fetchData(token) // refresh semua data
        } catch (err: any) {
            MySwal.fire({
                icon: "error",
                title: "Oops...",
                text: err.message || "Gagal update status cuti",
            })
        } finally {
            setLoading(false)
        }
    }

    const getNamaKaryawan = (id_karyawan: number) => {
        const karyawan = karyawanData.find(k => k.id_karyawan === id_karyawan)
        return karyawan ? karyawan.nama : "Tidak Diketahui"
    }

    // Filter berdasarkan search
    const filteredList = cutiList.filter(cuti =>
        getNamaKaryawan(cuti.id_karyawan).toLowerCase().includes(search.toLowerCase())
    )

    // Pagination
    const totalPages = Math.ceil(filteredList.length / itemsPerPage)
    const paginatedList = filteredList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    return (
        <div className="min-h-screen bg-gray-100 p-6 md:p-10">
            <div className="max-w-5xl mx-auto bg-white shadow-xl rounded-2xl p-8">

                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Persetujuan Cuti</h1>
                    <button
                        onClick={() => router.back()}
                        className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition font-semibold cursor-pointer"
                    >
                        <FiArrowLeft size={20} />
                    </button>
                </div>

                {/* Search */}
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Cari nama karyawan..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full border p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                        style={{ backgroundColor: "#ffffff", color: "#1f2937", placeholderColor: "#9ca3af" }}
                    />
                </div>

                {/* Loading / Error / Table */}
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <span className="ml-4 text-gray-500 font-semibold">Loading data...</span>
                    </div>
                ) : error ? (
                    <div className="text-center p-10 text-red-500">{error}</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse shadow rounded-lg">
                            <thead>
                                <tr className="bg-gray-800 text-white text-sm uppercase tracking-wider">
                                    <th className="p-3 text-left">No</th>
                                    <th className="p-3 text-left">Nama Karyawan</th>
                                    <th className="p-3 text-left">Tanggal Mulai</th>
                                    <th className="p-3 text-left">Tanggal Selesai</th>
                                    <th className="p-3 text-left">Jenis</th>
                                    <th className="p-3 text-left">Alasan</th>
                                    <th className="p-3 text-left">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedList.length > 0 ? (
                                    paginatedList.map((cuti, index) => (
                                        <tr key={cuti.id_cuti} className="bg-gray-50 hover:bg-blue-50 transition">
                                            <td className="p-3 text-black">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                            <td className="p-3 text-black">{getNamaKaryawan(cuti.id_karyawan)}</td>
                                            <td className="p-3 text-black">{cuti.tanggal_mulai}</td>
                                            <td className="p-3 text-black">{cuti.tanggal_selesai}</td>
                                            <td className="p-3 text-black capitalize">{cuti.jenis_cuti}</td>
                                            <td className="p-3 text-black">{cuti.alasan || "-"}</td>
                                            <td className="p-3">
                                                <select
                                                    value={cuti.status}
                                                    onChange={(e) => handleStatusChange(cuti.id_cuti, e.target.value)}
                                                    className={`border rounded-lg px-2 py-1 cursor-pointer font-medium transition
                  ${cuti.status === "disetujui" ? "bg-green-100 text-green-800" :
                                                            cuti.status === "ditolak" ? "bg-red-100 text-red-800" :
                                                                "bg-yellow-100 text-yellow-800"
                                                        }`}
                                                    disabled={loading}
                                                    style={{ appearance: "none" }}
                                                >
                                                    <option value="pending" className="bg-yellow-100 text-yellow-800">Pending</option>
                                                    <option value="disetujui" className="bg-green-100 text-green-800">Disetujui</option>
                                                    <option value="ditolak" className="bg-red-100 text-red-800">Ditolak</option>
                                                </select>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="p-3 text-center text-gray-500">Belum ada pengajuan cuti</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {!loading && totalPages > 1 && (
                    <div className="flex flex-wrap justify-center mt-4 gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 rounded bg-blue-300 text-white font-semibold hover:bg-blue-400 disabled:opacity-50 cursor-pointer"
                        >
                            Prev
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentPage(i + 1)}
                                className={`px-3 py-1 rounded font-semibold ${currentPage === i + 1
                                    ? "bg-blue-600 text-white cursor-pointer"
                                    : "bg-blue-400 text-white hover:bg-blue-500 cursor-pointer"
                                    }`}
                            >
                                {i + 1}
                            </button>
                        ))}
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 rounded bg-blue-300 text-white font-semibold hover:bg-blue-400 disabled:opacity-50 cursor-pointer"
                        >
                            Next
                        </button>
                    </div>
                )}

            </div>
        </div>
    )
}