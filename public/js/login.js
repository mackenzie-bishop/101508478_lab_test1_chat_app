document.getElementById("loginForm").addEventListener("submit", async function(e){

    e.preventDefault();

    const loginData = {
        username: document.getElementById("username").value,
        password: document.getElementById("password").value
    };

    const response = await fetch("/api/auth/login", {
        method:"POST",
        headers:{
            "Content-Type":"application/json"
        },
        body: JSON.stringify(loginData)
    });

    const data = await response.json();

    if(data.username){
        localStorage.setItem("username", data.username);
        alert("Login successful!");
        window.location.href = "/view/room.html";
    }else{
        alert(data.message);
    }

});
