"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { FiUsers, FiCalendar, FiUserCheck, FiClock, FiDownload, FiBriefcase, FiUserPlus, FiLogOut } from "react-icons/fi"
import Swal from "sweetalert2"

export default function Dashboard() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [karyawanData, setKaryawanData] = useState<any[]>([])
    const [absensiData, setAbsensiData] = useState<any[]>([])
    const [cutiData, setCutiData] = useState<any[]>([])
    const isAdminOrHr = user?.role === "admin hr"

    useEffect(() => {
        const token = localStorage.getItem("token")
        const userData = localStorage.getItem("user")

        if (!token) {
            router.push("/login")
            return
        }

        if (userData) setUser(JSON.parse(userData))

        fetchKaryawan(token)
        fetchAbsensi(token)
        fetchCuti(token)
    }, [])

    const fetchKaryawan = async (token: string) => {
        try {
            const res = await fetch("http://127.0.0.1:8000/api/karyawans", {
                headers: { "Authorization": `Bearer ${token}` }
            })
            if (!res.ok) throw new Error("Gagal fetch data karyawan")
            const data = await res.json()
            setKaryawanData(data)
        } catch (err) {
            console.error(err)
        }
    }

    const fetchAbsensi = async (token: string) => {
        try {
            const res = await fetch("http://127.0.0.1:8000/api/absensis", {
                headers: { "Authorization": `Bearer ${token}` }
            })
            if (!res.ok) throw new Error("Gagal fetch data absensi")
            const data = await res.json()
            setAbsensiData(data)
        } catch (err) {
            console.error(err)
        }
    }

    const fetchCuti = async (token: string) => {
        try {
            const res = await fetch("http://127.0.0.1:8000/api/cutis", {
                headers: { "Authorization": `Bearer ${token}` }
            })
            if (!res.ok) throw new Error("Gagal fetch data cuti")
            const data = await res.json()
            setCutiData(data)
        } catch (err) {
            console.error(err)
        }
    }

    // Fungsi export CSV
    const exportCSV = () => {
        // Map nama karyawan dari id_karyawan
        const namaMap: Record<number, string> = {}
        karyawanData.forEach(k => {
            namaMap[k.id_karyawan] = k.nama
        })

        // Absensi
        const absensiHeaders = ["ID Absensi", "ID Karyawan", "Nama Karyawan", "Tanggal", "Jam Masuk", "Jam Keluar", "Status"]
        const absensiRows = absensiData.map(item => [
            item.id_absensi,
            item.id_karyawan,
            namaMap[item.id_karyawan] ?? "",
            item.tanggal,
            item.jam_masuk ?? "",
            item.jam_keluar ?? "",
            item.status
        ])

        // Cuti
        const cutiHeaders = ["ID Cuti", "ID Karyawan", "Nama Karyawan", "Tanggal Mulai", "Tanggal Selesai", "Jenis Cuti", "Status"]
        const cutiRows = cutiData.map(item => [
            item.id_cuti,
            item.id_karyawan,
            namaMap[item.id_karyawan] ?? item.nama ?? "",
            item.tanggal_mulai,
            item.tanggal_selesai,
            item.jenis_cuti,
            item.status
        ])

        // Gabungkan CSV
        let csvContent: string[][] = []
        csvContent.push(["REKAP ABSENSI"])
        csvContent.push(absensiHeaders)
        csvContent.push(...absensiRows)
        csvContent.push([])

        csvContent.push(["REKAP CUTI"])
        csvContent.push(cutiHeaders)
        csvContent.push(...cutiRows)

        const csvString = csvContent.map(e => e.join(",")).join("\n")

        // Download CSV
        const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.setAttribute("href", url)
        link.setAttribute("download", "rekap_absensi_cuti.csv")
        link.click()
    }

    const handleLogout = () => {
        Swal.fire({
            title: "Logout",
            text: "Apakah kamu yakin ingin logout?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Ya, Logout",
            cancelButtonText: "Batal",
            background: "#ffffff",
            color: "#111827",
            iconColor: "#2563EB",
            confirmButtonColor: "#2563EB",
            cancelButtonColor: "#6B7280",
            customClass: { confirmButton: "cursor-pointer", cancelButton: "cursor-pointer" }
        }).then((result) => {
            if (result.isConfirmed) {
                localStorage.removeItem("token")
                localStorage.removeItem("user")
                Swal.fire({
                    icon: "success",
                    title: "Berhasil Logout!",
                    showConfirmButton: false,
                    timer: 1500,
                    background: "#ffffff",
                    color: "#111827",
                    iconColor: "#2563EB"
                })
                setTimeout(() => router.push("/login"), 1500)
            }
        })
    }

    const totalKaryawan = karyawanData.length
    const karyawanAktif = karyawanData.filter(k => k.status?.toLowerCase() === "aktif").length

    return (
        <div className="min-h-screen bg-gray-100 p-6 md:p-10">
            <div className="max-w-6xl mx-auto bg-white shadow-xl rounded-2xl p-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-4 md:mb-0">Dashboard</h1>
                    <button
                        onClick={handleLogout}
                        className="bg-red-500 text-white px-5 py-2 rounded-lg hover:bg-red-600 transition font-semibold flex items-center gap-1 cursor-pointer"
                    >
                        <FiLogOut size={20} /> Logout
                    </button>
                </div>

                {/* Welcome */}
                {user && (
                    <p className="text-gray-700 text-lg mb-6">
                        Selamat datang, <span className="font-bold">{user.name}</span>
                    </p>
                )}
                {/* ADMIN & HR */}
                {isAdminOrHr && (
                    <>
                        {/* Modern Stats Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                            <div className="flex items-center bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition">
                                <div className="bg-blue-100 text-blue-600 p-3 rounded-full mr-4">
                                    <FiUsers size={28} />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Total Karyawan</p>
                                    <p className="text-xl font-bold text-gray-800">{totalKaryawan}</p>
                                </div>
                            </div>

                            <div className="flex items-center bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition">
                                <div className="bg-green-100 text-green-600 p-3 rounded-full mr-4">
                                    <FiUserCheck size={28} />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Karyawan Aktif</p>
                                    <p className="text-xl font-bold text-gray-800">{karyawanAktif}</p>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Menu */}

                {/* ADMIN & HR */}

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-6">
                    {/* ADMIN & HR */}
                    {isAdminOrHr && (
                        <>
                            <Link href="/akun">
                                <div className="bg-teal-500 text-white p-6 rounded-xl shadow hover:shadow-lg transform hover:-translate-y-1 transition cursor-pointer flex flex-col justify-between h-full">
                                    <div>
                                        <FiUserPlus size={36} className="mb-4" />
                                        <h2 className="text-xl font-bold">Akun</h2>
                                        <p className="text-sm mt-2">Kelola akun dan profil pengguna</p>
                                    </div>
                                </div>
                            </Link>

                            <Link href="/manajemen_karyawan">
                                <div className="bg-blue-500 text-white p-6 rounded-xl shadow hover:shadow-lg transform hover:-translate-y-1 transition cursor-pointer flex flex-col justify-between h-full">
                                    <div>
                                        <FiUsers size={36} className="mb-4" />
                                        <h2 className="text-xl font-bold">Manajemen Karyawan</h2>
                                        <p className="text-sm mt-2">Lihat data seluruh karyawan</p>
                                    </div>
                                </div>
                            </Link>
                            <Link href="/jabatan_departemen">
                                <div className="bg-orange-500 text-white p-6 rounded-xl shadow hover:shadow-lg transform hover:-translate-y-1 transition cursor-pointer flex flex-col justify-between h-full">
                                    <div>
                                        <FiBriefcase size={36} className="mb-4" />
                                        <h2 className="text-xl font-bold">Jabatan & Departemen</h2>
                                        <p className="text-sm mt-2">Kelola jabatan dan departemen karyawan</p>
                                    </div>
                                </div>
                            </Link>
                        </>
                    )}
                    <Link href="/absensi">
                        <div className="bg-green-500 text-white p-6 rounded-xl shadow hover:shadow-lg transform hover:-translate-y-1 transition cursor-pointer flex flex-col justify-between h-full">
                            <div>
                                <FiClock size={36} className="mb-4" />
                                <h2 className="text-xl font-bold">Absensi</h2>
                                <p className="text-sm mt-2">Cek dan kelola absensi karyawan</p>
                            </div>
                        </div>
                    </Link>


                    <Link href="/cuti">
                        <div className="bg-purple-500 text-white p-6 rounded-xl shadow hover:shadow-lg transform hover:-translate-y-1 transition cursor-pointer flex flex-col justify-between h-full">
                            <div>
                                <FiCalendar size={36} className="mb-4" />
                                <h2 className="text-xl font-bold">Cuti</h2>
                                <p className="text-sm mt-2">Lihat dan ajukan cuti karyawan</p>
                            </div>
                        </div>
                    </Link>
                    {/* ADMIN & HR */}
                    {isAdminOrHr && (
                        <>
                            <Link href="/persetujuan_cuti">
                                <div className="bg-indigo-500 text-white p-6 rounded-xl shadow hover:shadow-lg transform hover:-translate-y-1 transition cursor-pointer flex flex-col justify-between h-full">
                                    <div>
                                        <FiUserCheck size={36} className="mb-4" />
                                        <h2 className="text-xl font-bold">Persetujuan Cuti</h2>
                                        <p className="text-sm mt-2">Setujui atau tolak pengajuan cuti</p>
                                    </div>
                                </div>
                            </Link>
                        </>
                    )}


                </div>

                {/* ADMIN & HR */}
                {isAdminOrHr && (
                    <>
                        {/* Tombol Export CSV */}
                        <div className="mt-4">
                            <button
                                onClick={exportCSV}
                                className="bg-yellow-500 text-white px-6 py-2 rounded-lg hover:bg-yellow-600 transition flex items-center gap-2 cursor-pointer"
                            >
                                <FiDownload /> Export Rekap Absensi CSV
                            </button>
                        </div>
                    </>
                )}

            </div>
        </div>
    )
}