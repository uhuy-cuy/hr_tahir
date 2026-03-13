"use client"

import { useEffect, useState } from "react"
import Swal from "sweetalert2"
import { FiEdit, FiTrash2, FiPlus, FiArrowLeft } from "react-icons/fi"
import { useRouter } from "next/navigation"
import { checkAdminAccess } from "@/lib/authGuard"
import Select from "react-select";

interface User {
    id: number
    id_karyawan: number
    name: string
    email: string
    status: string
    role: string
    password?: string
}

interface Karyawan {
    id: number
    nama: string
}

export default function KelolaAkun() {

    const [users, setUsers] = useState<User[]>([])
    const [karyawans, setKaryawans] = useState<Karyawan[]>([])
    const [loading, setLoading] = useState(true)

    const [showForm, setShowForm] = useState(false)
    const [formData, setFormData] = useState<Partial<User>>({})
    const [isEdit, setIsEdit] = useState(false)

    const [karyawanLoaded, setKaryawanLoaded] = useState(false)

    // ===== TAMBAHAN SEARCH =====
    const [searchTerm, setSearchTerm] = useState("")

    // ===== TAMBAHAN PAGINATION =====
    const [currentPage, setCurrentPage] = useState(1)
    const usersPerPage = 5

    const router = useRouter()

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null

    useEffect(() => {
        fetchUsers()
        fetchKaryawans()
        if (!checkAdminAccess(router)) return
    }, [])

    const fetchUsers = async () => {

        try {

            const res = await fetch("http://127.0.0.1:8000/api/users", {
                headers: { Authorization: `Bearer ${token}` }
            })

            const data = await res.json()

            setUsers(data)
            console.log("DATA USERS:", data)

        } catch {

            Swal.fire("Error", "Gagal mengambil data user", "error")

        } finally {

            setLoading(false)

        }
    }

    const fetchKaryawans = async () => {

        try {

            const res = await fetch("http://127.0.0.1:8000/api/karyawans", {
                headers: { Authorization: `Bearer ${token}` }
            })

            const data = await res.json()

            setKaryawans(data)

        } catch {

            Swal.fire("Error", "Gagal mengambil data karyawan", "error")

        }
    }

    const handleTambah = () => {

        setIsEdit(false)

        setFormData({
            name: "",
            email: "",
            password: "",
            role: "karyawan",
            status: "1",
            id_karyawan: undefined
        })

        setShowForm(true)
    }

    const handleEdit = (user: User) => {

        console.log("ID KARYAWAN:", user.id_karyawan)

        setIsEdit(true)

        setFormData({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
            id_karyawan: user.id_karyawan
        })

        setShowForm(true)
    }
    const handleDelete = (id: number) => {

        Swal.fire({
            title: "Hapus user?",
            icon: "warning",
            showCancelButton: true
        }).then(async res => {

            if (res.isConfirmed) {

                await fetch(`http://127.0.0.1:8000/api/users/${id}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` }
                })

                fetchUsers()

                Swal.fire("Berhasil", "User dihapus", "success")

            }

        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const url = isEdit
            ? `http://127.0.0.1:8000/api/users/${formData.id}`
            : `http://127.0.0.1:8000/api/users`;

        const method = isEdit ? "PUT" : "POST";

        const bodyData: any = { ...formData };
        if (!bodyData.password) delete bodyData.password;

        // --- Tambahkan console log di sini ---
        console.log("Data yang akan dikirim ke API:", bodyData);

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(bodyData)
            });

            if (!res.ok) {
                const data = await res.json();
                Swal.fire("Error", data.message || "Gagal menyimpan data", "error");
                return;
            }

            Swal.fire("Sukses", "Data tersimpan", "success");
            setShowForm(false);
            fetchUsers();

        } catch (err: any) {
            Swal.fire("Error", err.message || "Tidak bisa menghubungi server", "error");
        }
    };

    // ===== FILTER SEARCH =====
    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.role.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // ===== PAGINATION =====
    const indexOfLastUser = currentPage * usersPerPage
    const indexOfFirstUser = indexOfLastUser - usersPerPage
    const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser)

    const totalPages = Math.ceil(filteredUsers.length / usersPerPage)

    return (

        <div className="min-h-screen bg-gray-100 p-3 sm:p-6">

            <div className="max-w-6xl mx-auto">

                <div className="bg-white rounded-xl shadow p-4 sm:p-6">

                    <div className="flex flex-col sm:flex-row sm:justify-between gap-3 mb-4">

                        <h2 className="text-lg sm:text-xl font-bold text-gray-800">
                            Kelola Akun
                        </h2>

                        <div className="flex gap-2 flex-wrap">

                            <button
                                onClick={handleTambah}
                                className="bg-blue-500 text-white px-3 py-2 rounded flex items-center gap-2 text-sm sm:text-base cursor-pointer"
                            >
                                <FiPlus />
                                Tambah
                            </button>

                            <button
                                onClick={() => router.back()}
                                className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition font-semibold cursor-pointer"
                            >
                                <FiArrowLeft size={20} />
                            </button>

                        </div>

                    </div>

                    {/* SEARCH */}
                    <div className="mb-4">
                        <input
                            type="text"
                            placeholder="Cari nama, email, role..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value)
                                setCurrentPage(1)
                            }}
                            className="border p-2 rounded w-full sm:w-64 text-gray-800"
                        />
                    </div>

                    <div className="overflow-x-auto">

                        <table className="w-full border min-w-[600px]">

                            <thead className="bg-gray-800 text-white text-sm">

                                <tr>

                                    <th className="p-2">ID</th>
                                    <th className="p-2">Nama</th>
                                    <th className="p-2">Email</th>
                                    <th className="p-2">Role</th>
                                    <th className="p-2">Status</th>
                                    <th className="p-2 text-center">Aksi</th>

                                </tr>

                            </thead>

                            <tbody>

                                {loading ? (

                                    <tr>
                                        <td colSpan={6} className="text-center p-6 text-gray-600">
                                            Loading data...
                                        </td>
                                    </tr>

                                ) : (

                                    currentUsers.map(u => (

                                        <tr key={u.id} className="hover:bg-gray-100">

                                            <td className="p-2 text-gray-800 text-sm">{u.id}</td>
                                            <td className="p-2 text-gray-800 text-sm">{u.name}</td>
                                            <td className="p-2 text-gray-800 text-sm">{u.email}</td>
                                            <td className="p-2 text-gray-800 text-sm">{u.role}</td>

                                            <td className="p-2">

                                                <span className={`px-2 py-1 text-xs sm:text-sm text-white rounded ${u.status == "1" ? "bg-green-500" : "bg-gray-400"
                                                    }`}>

                                                    {u.status == "1" ? "Aktif" : "Nonaktif"}

                                                </span>

                                            </td>

                                            <td className="p-2 flex gap-2 justify-center">

                                                <button
                                                    onClick={() => handleEdit(u)}
                                                    className="bg-yellow-400 p-2 rounded text-white cursor-pointer "
                                                >
                                                    <FiEdit />
                                                </button>

                                                <button
                                                    onClick={() => handleDelete(u.id)}
                                                    className="bg-red-500 p-2 rounded text-white cursor-pointer "
                                                >
                                                    <FiTrash2 />
                                                </button>

                                            </td>

                                        </tr>

                                    ))

                                )}

                            </tbody>

                        </table>

                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
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

            {showForm && (

                <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center p-3">
                    <div className="bg-white rounded-lg shadow-xl p-5 w-full max-w-md max-h-[90vh] overflow-y-auto">

                        <h2 className="text-lg font-bold mb-4 text-gray-800">
                            {isEdit ? "Edit User" : "Tambah User"}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-3">

                            <div className="flex flex-col">
                                <label className="text-gray-700 font-semibold text-sm">Nama</label>
                                <input
                                    type="text"
                                    value={formData.name ?? ""}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="border p-2 rounded text-gray-800 text-sm"
                                />
                            </div>

                            <div className="flex flex-col">
                                <label className="text-gray-700 font-semibold text-sm">Email</label>
                                <input
                                    type="email"
                                    value={formData.email ?? ""}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="border p-2 rounded text-gray-800 text-sm"
                                />
                            </div>

                            <div className="flex flex-col">
                                <label className="text-gray-700 font-semibold text-sm">Password</label>
                                <input
                                    type="password"
                                    placeholder="Kosongkan jika tidak diubah"
                                    value={formData.password ?? ""}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    className="border p-2 rounded text-gray-800 text-sm"
                                />
                            </div>

                            <div className="flex flex-col text-gray-800">
                                <label className="text-gray-700 font-semibold text-sm">
                                    Karyawan {isEdit && <span className="text-gray-500 text-xs">(tidak bisa diubah)</span>}
                                </label>
                                <Select
                                    value={
                                        karyawans
                                            .map(k => ({ value: k.id_karyawan, label: k.nama }))
                                            .find(opt => opt.value === formData.id_karyawan) || null
                                    }
                                    onChange={selected => {
                                        setFormData(prev => ({ ...prev, id_karyawan: selected ? selected.value : undefined }));
                                    }}
                                    options={karyawans.map(k => ({ value: k.id_karyawan, label: k.nama }))}
                                    placeholder="Pilih Karyawan..."
                                    isDisabled={isEdit}
                                    isClearable={!isEdit}
                                    classNamePrefix="react-select"
                                    styles={{
                                        control: (provided) => ({
                                            ...provided,
                                            borderColor: "#111827"
                                        })
                                    }}
                                />
                            </div>

                            <div className="flex flex-col">
                                <label className="text-gray-700 font-semibold text-sm">Role</label>
                                <select
                                    value={formData.role ?? "karyawan"}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                    className="border p-2 rounded text-gray-800 text-sm cursor-pointer"
                                >
                                    <option value="admin hr">Admin HR</option>
                                    <option value="karyawan">Karyawan</option>
                                </select>
                            </div>

                            <div className="flex flex-col">
                                <label className="text-gray-700 font-semibold text-sm">Status</label>
                                <select
                                    value={formData.status ?? "1"}
                                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                                    className="border p-2 rounded text-gray-800 text-sm cursor-pointer"
                                >
                                    <option value="1">Aktif</option>
                                    <option value="0">Nonaktif</option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">

                                <button className="bg-green-500 text-white px-3 py-2 rounded text-sm cursor-pointer ">
                                    Simpan
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="bg-red-500 text-white px-3 py-2 rounded text-sm cursor-pointer "
                                >
                                    Batal
                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

        </div>

    )
}