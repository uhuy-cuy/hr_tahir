import Swal from "sweetalert2"

export function checkAdminAccess(router: any) {

    const token = localStorage.getItem("token")
    const userData = localStorage.getItem("user")

    // ❌ Tidak ada token
    if (!token) {
        Swal.fire({
            icon: "warning",
            title: "Belum Login",
            text: "Silakan login terlebih dahulu"
        })

        router.push("/login")
        return false
    }

    // ❌ Cek token expired / invalid
    try {
        const payload = JSON.parse(atob(token.split(".")[1]))
        const now = Date.now() / 1000

        if (payload.exp < now) {
            localStorage.clear()

            Swal.fire({
                icon: "warning",
                title: "Session Habis",
                text: "Silakan login kembali"
            })

            router.push("/login")
            return false
        }

    } catch (err) {
        // token rusak / tidak valid
        localStorage.clear()

        Swal.fire({
            icon: "error",
            title: "Token Tidak Valid",
            text: "Silakan login ulang"
        })

        router.push("/login")
        return false
    }

    // ❌ Cek role
    if (userData) {
        const user = JSON.parse(userData)

        if (user.role !== "admin hr") {
            Swal.fire({
                icon: "error",
                title: "Akses Ditolak",
                text: "Anda tidak memiliki hak akses ke halaman ini"
            })

            router.push("/dashboard")
            return false
        }
    }

    return true
}
