<template>
    <div v-if="playlist" class="playlist-container">
        <div class="playlist-header">
            <img :src="playlist.images[0]?.url" alt="Playlist Art" class="playlist-art" />
            <h1>{{ playlist.name }}</h1>
            <p>{{ playlist.description }}</p>

            <button class="vote-button" v-if="new Date().getDay() == votationDay && !hasVoted" @click="vote">
                <span>🗳️ Vote now!</span>
            </button>

            <button class="vote-button" v-if="hasVoted" @click="results">
                <span>📈 See results!</span>
            </button>
        </div>
        <ul class="track-list">
            <li v-for="(track, index) in playlist.tracks.items" :key="track.track.id" class="track-item"
                @click="playAudio">
                <div class="track-index">{{ index + 1 }}</div>
                <img :src="track.track.album.images[0]?.url" alt="Album Art" class="album-art" />
                <div class="track-info">
                    <audio ref="audio" :src="track.track.preview_url"></audio>
                    <span class="track-name">{{ isToday(new Date(track.added_at)) ? '🆕' : '' }} {{ track.track.name
                        }}</span>
                    <div class="track-details">
                        <span class="track-artists">{{ track.track.artists.map(artist => artist.name).join(', ')
                            }}</span>
                    </div>
                </div>
                <div class="user-info">
                    <img :src="track.added_by_image || defaultUserImage" alt="User Photo" class="user-photo" />
                    <span class="user-name">{{ track.added_by_name }}</span>
                </div>
            </li>
        </ul>
    </div>
</template>

<script>
import { supabase } from '@/utils/supabase';

export default {
    name: 'PlaylistView',
    data() {
        return {
            hasVoted: false,
            votationDay: 0,
            playlist: {
                name: '',
                description: '',
                images: [],
                tracks: {
                    items: [],
                },
            },
            defaultUserImage: 'https://placehold.co/300x300/1db954/white?text=',
            usersData: [{
                id: '',
                image: '',
                name: '',
            }],
        };
    },
    created() {
        this.votationDay = process.env.VUE_APP_VOTATION_DAY;

        const urlToken = window.location.hash.substring(1).split('&').find(elem => elem.startsWith('access_token'))
        if (!urlToken && !localStorage.getItem('access_token')) {
            window.location.href = window.location.origin + '/';
            return;
        }

        const accessToken = urlToken ? window.location.hash
            .substring(1)
            .split('&')
            .find(elem => elem.startsWith('access_token'))
            .split('=')[1] : localStorage.getItem('access_token');

        localStorage.setItem('access_token', accessToken);

        this.getUserInfo();
        this.getTracks();
        this.alreadyVoted();
    },
    methods: {
        isToday(date) {
            const today = new Date();
            return (
                date.getDate() === today.getDate() &&
                date.getMonth() === today.getMonth() &&
                date.getFullYear() === today.getFullYear()
            );
        },
        getUserInfo() {
            const accessToken = localStorage.getItem('access_token');
            fetch('https://api.spotify.com/v1/me', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            })
                .then(response => response.json())
                .then(data => {
                    if (data.error) {
                        console.error('Error al obtener la lista de reproducción:', data.error);
                        return;
                    }

                    localStorage.setItem('user', JSON.stringify(data));
                });
        },
        getTracks(url) {
            const accessToken = localStorage.getItem('access_token');
            const playlistId = process.env.VUE_APP_SPOTIFY_PLAYLIST_ID;
            fetch(url || `https://api.spotify.com/v1/playlists/${playlistId}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            })
                .then(response => response.json())
                .then(data => {
                    if (data.error) {
                        console.error('Error al obtener la lista de reproducción:', data.error);

                        if (data.error.status === 401) {
                            window.location.href = window.location.origin + '/';
                        }

                        return;
                    }

                    if (data.name == null) {
                        this.playlist.tracks.items.push(...data.items);
                        this.playlist.tracks.items = this.playlist.tracks.items.sort((a, b) => new Date(b.added_at) - new Date(a.added_at))
                        this.loadUserImages();
                        this.checkNextPage(data.next)
                        return;
                    }

                    this.playlist = data;
                    this.playlist.tracks.items = this.playlist.tracks.items.sort((a, b) => new Date(b.added_at) - new Date(a.added_at))
                    this.loadUserImages();
                    this.checkNextPage(data.tracks.next)
                });
        },
        checkNextPage(next) {
            if (!next) {
                return;
            }

            this.getTracks(next);
        },
        formatDuration(ms) {
            const minutes = Math.floor(ms / 60000);
            const seconds = ((ms % 60000) / 1000).toFixed(0);
            return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        },
        async loadUserImages() {
            for (const track of this.playlist.tracks.items) {
                if (this.usersData.find(user => user.id === track.added_by.id)) {
                    track.added_by_image = this.usersData.find(user => user.id === track.added_by.id).image;
                    track.added_by_name = this.usersData.find(user => user.id === track.added_by.id).name;
                    continue;
                }

                try {
                    const user = await this.getUserImage(track.added_by.id);
                    track.added_by_name = user.display_name

                    let imageUrl;
                    if (user.images != null && user.images.length > 0) {
                        imageUrl = user.images[0].url;
                    }

                    let defaultImage = this.defaultUserImage + track.added_by_name.substring(0, 1);
                    track.added_by_image = imageUrl || defaultImage;

                    this.usersData.push({ id: user.id, image: track.added_by_image, name: track.added_by_name });

                } catch (error) {
                    console.error('Error al cargar la imagen del usuario:', error);
                    track.added_by_image = this.defaultUserImage;
                    track.added_by_name = 'Unknwon User';
                }
            }

            localStorage.removeItem('playlist');
            localStorage.setItem('playlist', JSON.stringify(this.playlist));
        },
        async getUserImage(user) {
            try {
                const accessToken = localStorage.getItem('access_token');
                const response = await fetch(`https://api.spotify.com/v1/users/${user}`, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });

                const data = await response.json();
                return data;
            } catch (error) {
                console.error('Error al obtener la imagen del usuario:', error);
                return null;
            }
        },
        async alreadyVoted() {
            const { error } = await supabase
                .from('election')
                .select('user_token, created_at')
                .eq('user_token', JSON.parse(localStorage.getItem('user')).id)
                .single();

            this.hasVoted = !(error && error.code === 'PGRST116');
        },
        vote() {
            window.location.href = window.location.origin + '/vote';
        },
        results() {
            window.location.href = window.location.origin + '/results';
        }
    },
};
</script>

<style scoped>
.playlist-container {
    padding: 20px;
    background-color: #121212;
    color: white;
    min-height: 100vh;
}

.playlist-header {
    text-align: center;
    margin-bottom: 20px;
}

.playlist-header img.playlist-art {
    width: 200px;
    height: 200px;
    border-radius: 10px;
    margin-bottom: 20px;
}

.playlist-header h1 {
    font-size: 3rem;
    font-weight: 700;
}

.playlist-header p {
    font-size: 1.2rem;
    color: #b3b3b3;
}

.track-list {
    list-style-type: none;
    padding: 0;
}

.track-item {
    display: flex;
    align-items: center;
    padding: 10px;
    margin: 5px 0;
    border-radius: 5px;
    transition: background-color 0.3s;
}

.track-item:hover {
    background-color: #1db954;
}

.album-art {
    width: 50px;
    height: 50px;
    border-radius: 5px;
    margin-right: 15px;
}

.user-info {
    display: flex;
    flex-direction: column;
    align-items: end;
    gap: 0.1rem;
}

.track-info {
    display: flex;
    flex-direction: column;
    flex-grow: 2;
}

.track-index {
    font-size: 1.2rem;
    font-weight: 600;
    margin-right: 10px;
}

.track-name {
    font-size: 1.1rem;
    font-weight: 600;
}

.track-details {
    display: flex;
    justify-content: space-between;
}

.user-name,
.track-artists {
    font-size: 0.9rem;
    color: #b3b3b3;
}

.user-name {
    font-size: 0.7rem;
    text-align: end;
}

.track-duration {
    font-size: 0.9rem;
    color: #b3b3b3;
    margin-left: 10px;
}

.user-photo {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    margin-left: 15px;
}

.vote-button:disabled {
    opacity: 0.3;
}
</style>
