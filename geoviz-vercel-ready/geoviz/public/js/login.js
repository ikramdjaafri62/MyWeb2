window.login = async function () {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const response = await fetch("/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username,
            password
        })
    });

    const data = await response.json();

    if (data.success) {
        // 🔹 Save BOTH user info and the token
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("token", data.token); 

        alert("Login successful");

        // 🔹 Redirect based on role
        if (data.user.role === "admin") {
            window.location.href = "admin.html";
        } else {
            window.location.href = "index.html";
        }
    } else {
        alert("Username or password incorrect");
    }
}