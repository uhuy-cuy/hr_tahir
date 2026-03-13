"use client"

import { useEffect, useState } from "react"
import Swal from "sweetalert2"
import { FiEdit, FiTrash2, FiPlus,FiArrowLeft } from "react-icons/fi"
import { useRouter } from "next/navigation"
import { checkAdminAccess } from "@/lib/authGuard"

interface Jabatan {
    id_jabatan: number
    nama_jabatan: string
}

interface Departemen {
    id_departemen: number
    nama_departemen: string
}

export default function JabatanDepartemen() {
    const [jabatans, setJabatans] = useState<Jabatan[]>([])
    const [departemens, setDepartemens] = useState<Departemen[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [showForm, setShowForm] = useState(false)
    const [formData, setFormData] = useState<any>({})
    const [formType, setFormType] = useState<"jabatan" | "departemen">("jabatan")
    const router = useRouter()

    const token = localStorage.getItem("token")

    useEffect(() => {
        fetchData()
        if (!checkAdminAccess(router)) return
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [jabRes, depRes] = await Promise.all([
                fetch("http://127.0.0.1:8000/api/jabatans", { headers: { Authorization: `Bearer ${token}` } }),
                fetch("http://127.0.0.1:8000/api/departemens", { headers: { Authorization: `Bearer ${token}` } })
            ])
            const jabData = await jabRes.json()
            const depData = await depRes.json()
            setJabatans(jabData)
            setDepartemens(depData)
        } catch (err) {
            console.error(err)
            Swal.fire("Error", "Gagal mengambil data", "error")
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (type: "jabatan" | "departemen", id: number) => {
        const url = type === "jabatan" ? `http://127.0.0.1:8000/api/jabatans/${id}` : `http://127.0.0.1:8000/api/departemens/${id}`
        Swal.fire({
            title: "Apakah yakin?",
            text: `Data ${type} akan dihapus!`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Ya, hapus!",
            cancelButtonText: "Batal"
        }).then(async res => {
            if (res.isConfirmed) {
                try {
                    const response = await fetch(url, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } })
                    if (!response.ok) throw new Error("Gagal menghapus")
                    Swal.fire("Terhapus!", `Data ${type} berhasil dihapus`, "success")
                    fetchData()
                } catch (err: any) {
                    Swal.fire("Error", err.message || "Gagal menghapus", "error")
                }
            }
        })
    }

    const handleEdit = (type: "jabatan" | "departemen", data: any) => {
        setFormType(type)
        setFormData(data)
        setShowForm(true)
    }

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const isJabatan = formType === "jabatan"
        const url = formData[isJabatan ? "id_jabatan" : "id_departemen"]
            ? `http://127.0.0.1:8000/api/${isJabatan ? "jabatans" : "departemens"}/${formData[isJabatan ? "id_jabatan" : "id_departemen"]}`
            : `http://127.0.0.1:8000/api/${isJabatan ? "jabatans" : "departemens"}`
        const method = formData[isJabatan ? "id_jabatan" : "id_departemen"] ? "PUT" : "POST"
        try {
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(formData)
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.message || "Gagal menyimpan")
            Swal.fire("Sukses", `Data ${formType} berhasil disimpan`, "success")
            setShowForm(false)
            setFormData({})
            fetchData()
        } catch (err: any) {
            Swal.fire("Error", err.message || "Gagal menyimpan", "error")
        }
    }

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-10">
            {/* Overlay Loading */}
            {loading && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
                    <div className="text-white text-lg font-semibold animate-pulse">
                        Loading data...
                    </div>
                </div>
            )}
            <div className="max-w-7xl mx-auto space-y-8">

                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800"></h1>
                    <button
                        onClick={() => router.back()}
                        className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition font-semibold cursor-pointer"
                    >
                        <FiArrowLeft size={20} />
                    </button>
                </div>

                {!loading &&
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* TABEL JABATAN */}
                        <div className="bg-white shadow-xl rounded-2xl p-4">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="font-bold text-lg text-gray-800">Jabatan</h2>
                                <div className="flex gap-2">
                                    <button onClick={() => { setFormType("jabatan"); setFormData({}); setShowForm(true) }}
                                        className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded cursor-pointer">
                                        <FiPlus /> Tambah
                                    </button>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[300px] border-collapse">
                                    <thead>
                                        <tr className="bg-gray-800 text-white text-sm uppercase">
                                            <th className="p-2">ID</th>
                                            <th className="p-2">Nama Jabatan</th>
                                            <th className="p-2">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {jabatans.map(j => (
                                            <tr key={j.id_jabatan} className="hover:bg-gray-100 transition">
                                                <td className="p-2 text-gray-800">{j.id_jabatan}</td>
                                                <td className="p-2 text-gray-800">{j.nama_jabatan}</td>
                                                <td className="p-2 flex gap-2 justify-center flex-nowrap">
                                                    <button onClick={() => handleEdit("jabatan", j)} className="bg-yellow-400 px-2 py-1 rounded hover:bg-yellow-500 text-white cursor-pointer"><FiEdit /></button>
                                                    <button onClick={() => handleDelete("jabatan", j.id_jabatan)} className="bg-red-500 px-2 py-1 rounded hover:bg-red-600 text-white cursor-pointer"><FiTrash2 /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* TABEL DEPARTEMEN */}
                        <div className="bg-white shadow-xl rounded-2xl p-4">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="font-bold text-lg text-gray-800">Departemen</h2>
                                <div className="flex gap-2">
                                    <button onClick={() => { setFormType("departemen"); setFormData({}); setShowForm(true) }}
                                        className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded cursor-pointer">
                                        <FiPlus /> Tambah
                                    </button>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[300px] border-collapse">
                                    <thead>
                                        <tr className="bg-gray-800 text-white text-sm uppercase">
                                            <th className="p-2">ID</th>
                                            <th className="p-2">Nama Departemen</th>
                                            <th className="p-2">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {departemens.map(d => (
                                            <tr key={d.id_departemen} className="hover:bg-gray-100 transition">
                                                <td className="p-2 text-gray-800">{d.id_departemen}</td>
                                                <td className="p-2 text-gray-800">{d.nama_departemen}</td>
                                                <td className="p-2 flex gap-2 justify-center flex-nowrap">
                                                    <button onClick={() => handleEdit("departemen", d)} className="bg-yellow-400 px-2 py-1 rounded hover:bg-yellow-500 text-white cursor-pointer"><FiEdit /></button>
                                                    <button onClick={() => handleDelete("departemen", d.id_departemen)} className="bg-red-500 px-2 py-1 rounded hover:bg-red-600 text-white cursor-pointer"><FiTrash2 /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                }

                {/* MODAL FORM */}
                {showForm && (
                    <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50 p-4">
                        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 w-full max-w-md shadow-2xl">
                            <h2 className="text-xl font-bold mb-4 text-gray-800">{formType === "jabatan" ? (formData.id_jabatan ? "Edit Jabatan" : "Tambah Jabatan") : (formData.id_departemen ? "Edit Departemen" : "Tambah Departemen")}</h2>
                            <form onSubmit={handleFormSubmit} className="space-y-3">
                                <div className="flex flex-col">
                                    <label className="font-semibold text-gray-800">Nama {formType === "jabatan" ? "Jabatan" : "Departemen"}</label>
                                    <input type="text" required
                                        value={formType === "jabatan" ? formData.nama_jabatan ?? "" : formData.nama_departemen ?? ""}
                                        onChange={e => setFormData({ ...formData, [formType === "jabatan" ? "nama_jabatan" : "nama_departemen"]: e.target.value })}
                                        className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800" />
                                </div>
                                <div className="flex justify-end gap-2 mt-4">
                                    <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 cursor-pointer">Simpan</button>
                                    <button type="button" onClick={() => setShowForm(false)} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 cursor-pointer">Batal</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}