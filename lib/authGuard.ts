import Swal from "sweetalert2"

export function checkAdminAccess(router: any) {

    const token = localStorage.getItem("token")
    const userData = localStorage.getItem("user")

    if (!token) {

        Swal.fire({
            icon: "warning",
            title: "Belum Login",
            text: "Silakan login terlebih dahulu"
        })

        router.push("/login")
        return false
    }

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