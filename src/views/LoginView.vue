<!-- src/views/Login.vue -->
<template>
    <div class="login-container">
        <div class="login-content">
            <img src="../assets/logo.png" alt="Spotify Logo">
            <button @click="login">Login with Spotify</button>
        </div>

        <span class="powered">Powered by Jei</span>
        <span class="version">v{{ version }}</span>
    </div>
</template>

<script>
export default {
    name: 'LoginView',
    data() {
        return {
            version: process.env.VUE_APP_VERSION,
        };
    },
    methods: {
        login() {
            const clientId = process.env.VUE_APP_SPOTIFY_CLIENT_ID;
            const redirectUri = process.env.VUE_APP_SPOTIFY_REDIRECT_URI;
            const scope = 'playlist-read-private';
            const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${redirectUri}&scope=${scope}`;

            window.location.href = authUrl;
        },
    },
};
</script>

<style scoped>
.login-container {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;

    height: 100vh;
    background-color: #121212;
}

.login-content {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;

    text-align: center;
    background-color: #1e1e1e;
    padding: 40px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

img {
    height: 100px;
    margin-bottom: 20px;
}

h1 {
    font-size: 2.5rem;
    margin-bottom: 20px;
}

button {
    font-size: 1.2rem;
    padding: 10px 40px;
}


.powered {
    font-size: 0.8rem;
    color: #b3b3b3;
    margin-top: 40px;
}

.version {
    font-size: 0.7rem;
    color: #b3b3b3;
    margin-top: 10px;
}
</style>