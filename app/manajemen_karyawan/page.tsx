"use client"

import Swal from "sweetalert2"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { FiDownload, FiEdit, FiTrash2, FiArrowLeft } from "react-icons/fi"
import { checkAdminAccess } from "@/lib/authGuard"

interface Karyawan {
    id_karyawan: number
    nama: string
    nik: string
    email: string
    phone: string
    jabatan?: { nama_jabatan: string }
    departemen?: { nama_departemen: string }
    status: string
}

export default function DataKaryawan() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [karyawans, setKaryawans] = useState<Karyawan[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)

    const [showForm, setShowForm] = useState(false)
    const [formData, setFormData] = useState<any>({
        id_karyawan: null,
        nama: "",
        nik: "",
        email: "",
        phone: "",
        jabatan: "",
        departemen: "",
        status: "aktif",
    })

    useEffect(() => {
        const token = localStorage.getItem("token")
        const userData = localStorage.getItem("user")
        if (!token) {
            router.push("/login")
            return
        }
        if (userData) setUser(JSON.parse(userData))
        fetchKaryawans()
        if (!checkAdminAccess(router)) return
    }, [router])

    const fetchKaryawans = async () => {
        setLoading(true)
        const token = localStorage.getItem("token")
        try {
            const res = await fetch("http://127.0.0.1:8000/api/karyawans", {
                headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
            })
            if (!res.ok) throw new Error("Gagal mengambil data karyawan")
            const data = await res.json()
            if (Array.isArray(data)) setKaryawans(data)
            else if (Array.isArray(data.data)) setKaryawans(data.data)
            else setKaryawans([])
        } catch (err: any) {
            setError(err.message || "Terjadi kesalahan")
        } finally { setLoading(false) }
    }

    const handleEdit = (karyawan: Karyawan) => {
        setFormData({
            id_karyawan: karyawan.id_karyawan,
            nama: karyawan.nama,
            nik: karyawan.nik,
            email: karyawan.email,
            phone: karyawan.phone,
            id_jabatan: karyawan.jabatan?.id_jabatan ?? "",
            id_departemen: karyawan.departemen?.id_departemen ?? "",
            status: karyawan.status,
        })
        setShowForm(true)
    }

    const handleDelete = async (id: number) => {
        Swal.fire({
            title: "Apakah Anda yakin?",
            text: "Data karyawan akan dihapus permanen!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Ya, hapus!",
            cancelButtonText: "Batal",
        }).then(async (result) => {
            if (result.isConfirmed) {
                const token = localStorage.getItem("token")
                try {
                    const res = await fetch(`http://127.0.0.1:8000/api/karyawans/${id}`, {
                        method: "DELETE",
                        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
                    })
                    const data = await res.json()
                    if (!res.ok) {
                        Swal.fire({ icon: "error", title: "Terjadi Kesalahan", text: data.message || "Gagal menghapus data karyawan.", confirmButtonText: "OK" })
                        return
                    }
                    setKaryawans(prev => prev.filter(k => k.id_karyawan !== id))
                    Swal.fire({ icon: "success", title: "Terhapus!", text: "Data karyawan berhasil dihapus.", confirmButtonText: "OK" })
                } catch (err: any) {
                    Swal.fire({ icon: "error", title: "Terjadi Kesalahan", text: err.message || "Gagal menghapus data karyawan.", confirmButtonText: "OK" })
                }
            }
        })
    }

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const token = localStorage.getItem("token")
        const method = formData.id_karyawan ? "PUT" : "POST"
        const url = formData.id_karyawan ? `http://127.0.0.1:8000/api/karyawans/${formData.id_karyawan}` : "http://127.0.0.1:8000/api/karyawans"

        try {
            const res = await fetch(url, {
                method,
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify(formData),
            })
            const data = await res.json()
            if (!res.ok) {
                let pesan = data.message || "Gagal menyimpan data."
                if (data.errors) pesan = Object.values(data.errors).flat().join("\n")
                Swal.fire({ icon: "error", title: "Gagal", text: pesan, confirmButtonText: "OK" })
                return
            }
            fetchKaryawans()
            setShowForm(false)
            setFormData({ id_karyawan: null, nama: "", nik: "", email: "", phone: "", id_jabatan: "", id_departemen: "", status: "aktif" })
            Swal.fire({ icon: "success", title: "Sukses", text: data.message || `Data karyawan ${formData.id_karyawan ? "diupdate" : "disimpan"} berhasil`, confirmButtonText: "OK" })
        } catch (err: any) {
            Swal.fire({ icon: "error", title: "Terjadi Kesalahan", text: err.message || "Gagal menyimpan data", confirmButtonText: "OK" })
        }
    }

    const [jabatans, setJabatans] = useState<any[]>([])
    const [departemens, setDepartemens] = useState<any[]>([])
    useEffect(() => {
        const token = localStorage.getItem("token")
        if (!token) return
        fetch("http://127.0.0.1:8000/api/jabatans", { headers: { Authorization: `Bearer ${token}` } })
            .then(res => res.json()).then(data => setJabatans(data))
        fetch("http://127.0.0.1:8000/api/departemens", { headers: { Authorization: `Bearer ${token}` } })
            .then(res => res.json()).then(data => setDepartemens(data))
    }, [])

    const exportCSV = () => {
        if (karyawans.length === 0) { Swal.fire("Info", "Tidak ada data karyawan untuk diexport.", "info"); return }
        const header = ["No", "Nama", "NIK", "Email", "Phone", "Jabatan", "Departemen", "Status"]
        const rows = karyawans.map((k, i) => [i + 1, k.nama, k.nik, k.email, k.phone, k.jabatan?.nama_jabatan ?? "-", k.departemen?.nama_departemen ?? "-", k.status])
        const csvContent = "Data Karyawan\n" + [header, ...rows].map(e => e.map(v => `"${v}"`).join(",")).join("\n")
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.setAttribute("download", `data_karyawan_${new Date().toISOString().slice(0, 10)}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const [searchQuery, setSearchQuery] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10
    const filteredKaryawans = karyawans.filter(k =>
        k.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        k.nik.toLowerCase().includes(searchQuery.toLowerCase()) ||
        k.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        k.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (k.jabatan?.nama_jabatan ?? "-").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (k.departemen?.nama_departemen ?? "-").toLowerCase().includes(searchQuery.toLowerCase()) ||
        k.status.toLowerCase().includes(searchQuery.toLowerCase())
    )
    const totalPages = Math.ceil(filteredKaryawans.length / itemsPerPage)
    const paginatedKaryawans = filteredKaryawans.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-10">
            <div className="max-w-7xl mx-auto bg-white shadow-xl rounded-2xl p-4 sm:p-8">
                {/* HEADER */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-8 gap-4 sm:gap-0">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">DATA KARYAWAN</h1>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={exportCSV}
                            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-5 py-3 rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200 cursor-pointer"
                        >
                            <FiDownload size={20} />
                            Export Rekap Karyawan CSV
                        </button>
                        <button onClick={() => { setFormData({ id_karyawan: null, nama: "", nik: "", email: "", phone: "", jabatan: "", departemen: "", status: "aktif" }); setShowForm(true) }}
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition cursor-pointer">Tambah Karyawan</button>
                        <button onClick={() => router.back()} className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 transition font-semibold cursor-pointer"> <FiArrowLeft size={20} /></button>
                    </div>
                </div>

                {/* Search */}
                <div className="mb-4">
                    <input type="text" placeholder="Cari karyawan..." value={searchQuery}
                        onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1) }}
                        className="w-full sm:w-1/3 p-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-gray-800 transition" />
                </div>

                {/* TABLE */}
                {loading ? <div className="text-center p-10 text-gray-500">Loading data...</div> :
                    error ? <div className="text-center p-10 text-red-500">{error}</div> :
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[700px] border-collapse">
                                <thead>
                                    <tr className="bg-gray-800 text-white text-sm uppercase tracking-wider">
                                        <th className="p-2 sm:p-3 text-left">No</th>
                                        <th className="p-2 sm:p-3 text-left">Nama</th>
                                        <th className="p-2 sm:p-3 text-left">NIK</th>
                                        <th className="p-2 sm:p-3 text-left">Email</th>
                                        <th className="p-2 sm:p-3 text-left">Phone</th>
                                        <th className="p-2 sm:p-3 text-left">Jabatan</th>
                                        <th className="p-2 sm:p-3 text-left">Departemen</th>
                                        <th className="p-2 sm:p-3 text-left">Status</th>
                                        <th className="p-2 sm:p-3 text-left">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedKaryawans.length > 0 ? paginatedKaryawans.map((k, i) => (
                                        <tr key={k.id_karyawan} className={`text-gray-700 ${i % 2 === 0 ? "bg-gray-50" : "bg-white"} hover:bg-blue-50 transition`}>
                                            <td className="p-2 sm:p-3 font-semibold">{(currentPage - 1) * itemsPerPage + i + 1}</td>
                                            <td className="p-2 sm:p-3 font-medium">{k.nama}</td>
                                            <td className="p-2 sm:p-3">{k.nik}</td>
                                            <td className="p-2 sm:p-3">{k.email}</td>
                                            <td className="p-2 sm:p-3">{k.phone}</td>
                                            <td className="p-2 sm:p-3">{k.jabatan?.nama_jabatan ?? "-"}</td>
                                            <td className="p-2 sm:p-3">{k.departemen?.nama_departemen ?? "-"}</td>
                                            <td className="p-2 sm:p-3">
                                                <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap ${k.status === "aktif" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                                    {k.status}
                                                </span>
                                            </td>
                                            <td className="p-2 sm:p-3 flex justify-center flex-nowrap gap-2">
                                                <button
                                                    onClick={() => handleEdit(k)}
                                                    className="bg-yellow-400 text-white px-2 sm:px-3 py-1 rounded hover:bg-yellow-500 transition cursor-pointer flex items-center justify-center"
                                                >
                                                    <FiEdit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(k.id_karyawan)}
                                                    className="bg-red-500 text-white px-2 sm:px-3 py-1 rounded hover:bg-red-600 transition cursor-pointer flex items-center justify-center"
                                                >
                                                    <FiTrash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    )) : <tr><td colSpan={9} className="text-center p-5 text-gray-500">Data karyawan kosong</td></tr>}
                                </tbody>
                            </table>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex flex-wrap justify-center mt-4 gap-2">
                                    <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1 rounded bg-blue-300 text-white font-semibold hover:bg-blue-400 disabled:opacity-50 cursor-pointer">Prev</button>

                                    {Array.from({ length: totalPages }, (_, i) => (
                                        <button key={i} onClick={() => setCurrentPage(i + 1)}
                                            className={`px-3 py-1 rounded font-semibold ${currentPage === i + 1 ? "bg-blue-600 text-white cursor-pointer" : "bg-blue-400 text-white hover:bg-blue-500 cursor-pointer"}`}>{i + 1}</button>
                                    ))}

                                    <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-1 rounded bg-blue-300 text-white font-semibold hover:bg-blue-400 disabled:opacity-50 cursor-pointer">Next</button>
                                </div>
                            )}
                        </div>
                }

                {/* FORM MODAL */}
                {showForm && (
                    <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50 p-4">
                        <div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto p-6 relative">
                            <h2 className="text-xl font-bold mb-4 text-white">{formData.id_karyawan ? "Edit Karyawan" : "Tambah Karyawan"}</h2>
                            <form onSubmit={handleFormSubmit} className="space-y-3">

                                {/* Nama & NIK */}
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <div className="flex-1 flex flex-col space-y-2">
                                        <label className="text-white">Nama</label>
                                        <input type="text" placeholder="Nama" required
                                            value={formData.nama} onChange={e => setFormData({ ...formData, nama: e.target.value })}
                                            className="w-full p-2 border rounded bg-gray-100 text-black" />
                                    </div>
                                    <div className="flex-1 flex flex-col space-y-2">
                                        <label className="text-white">NIK</label>
                                        <input type="text" placeholder="NIK" required
                                            value={formData.nik} onChange={e => setFormData({ ...formData, nik: e.target.value })}
                                            className="w-full p-2 border rounded bg-gray-100 text-black" />
                                    </div>
                                </div>

                                {/* Email & Phone */}
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <div className="flex-1 flex flex-col space-y-2">
                                        <label className="text-white">Email</label>
                                        <input type="email" placeholder="Email" required
                                            value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full p-2 border rounded bg-gray-100 text-black" />
                                    </div>
                                    <div className="flex-1 flex flex-col space-y-2">
                                        <label className="text-white">Phone</label>
                                        <input type="text" placeholder="Phone" required
                                            value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full p-2 border rounded bg-gray-100 text-black" />
                                    </div>
                                </div>

                                {/* Jabatan & Departemen */}
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <div className="flex-1 flex flex-col space-y-2">
                                        <label className="text-white">Jabatan</label>
                                        <select value={formData.id_jabatan} onChange={e => setFormData({ ...formData, id_jabatan: e.target.value })}
                                            className="w-full p-2 border rounded bg-gray-100 text-black cursor-pointer" required>
                                            <option value="">-- Pilih Jabatan --</option>
                                            {jabatans.map(j => <option key={j.id_jabatan} value={j.id_jabatan}>{j.nama_jabatan}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex-1 flex flex-col space-y-2">
                                        <label className="text-white">Departemen</label>
                                        <select value={formData.id_departemen} onChange={e => setFormData({ ...formData, id_departemen: e.target.value })}
                                            className="w-full p-2 border rounded bg-gray-100 text-black cursor-pointer" required>
                                            <option value="">-- Pilih Departemen --</option>
                                            {departemens.map(d => <option key={d.id_departemen} value={d.id_departemen}>{d.nama_departemen}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* Status */}
                                <div className="flex flex-col space-y-2">
                                    <label className="text-white">Status</label>
                                    <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full p-2 border rounded bg-gray-100 text-black cursor-pointer">
                                        <option value="aktif">Aktif</option>
                                        <option value="non-aktif">Nonaktif</option>
                                    </select>
                                </div>

                                {/* Buttons */}
                                <div className="flex flex-wrap justify-end gap-2 mt-4">
                                    <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition cursor-pointer">{formData.id_karyawan ? "Update" : "Simpan"}</button>
                                    <button type="button" onClick={() => setShowForm(false)} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition cursor-pointer">Batal</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}