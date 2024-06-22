<template>
    <div v-if="isShowing" ref="interactElement" :class="{
        isAnimating: isInteractAnimating,
        isCurrent: isCurrent
    }" class="card" :style="{ transform: transformString }">
        <img :src="card.track.album.images[0]?.url" alt="Album Art" class="album-art" />
        <div class="cardInfo">
            <span class="cardTitle">{{ card.track.name }}</span>
            <p class="cardArtist">{{ card.track.artists.map(artist => artist.name).join(', ') }}</p>
        </div>
        <div class="audioControls">
            <audio ref="audio" :src="card.track.preview_url"></audio>
            <button class="play-button" @click="playAudio">
                <span>{{ isPlaying ? '⏸️ Pause' : '▶️ Play' }}</span>
            </button>
        </div>
        <div class="userInfo">
            <img :src="card.added_by_image" alt="User Photo" class="user-photo" />
            <p class="user-name">{{ card.added_by_name }}</p>
        </div>
        <div v-if="isInteractDragged" class="interaction-indicator" :class="indicatorClass">
            <p>{{ indicatorText }}</p>
        </div>
    </div>
</template>

<script>
const interact = require("interactjs");

const ACCEPT_CARD = "cardAccepted";
const REJECT_CARD = "cardRejected";
const SKIP_CARD = "cardSkipped";

export default {
    static: {
        interactMaxRotation: 15,
        interactOutOfSightXCoordinate: 500,
        interactOutOfSightYCoordinate: 600,
        interactYThreshold: 10,
        interactXThreshold: 10,
    },
    props: {
        card: {
            type: Object,
            required: true
        },
        position: {
            type: Number,
            required: true,
        },
        isCurrent: {
            type: Boolean,
            required: true
        }
    },
    data() {
        return {
            isShowing: true,
            isInteractAnimating: true,
            isInteractDragged: false,
            interactPosition: {
                x: 0,
                y: 0,
                rotation: 0
            },
            isPlaying: false,
        };
    },
    created() {
    },
    computed: {
        transformString() {
            if (!this.isInteractAnimating || this.isInteractDragged) {
                const { x, y, rotation } = this.interactPosition;
                return `translate3D(${x}px, ${y}px, 0) rotate(${rotation}deg)`;
            }

            return null;
        },
        indicatorText() {
            const { x } = this.interactPosition;
            if (x > 0) return "✅";
            if (x < 0) return "❌";
            return "";
        },
        indicatorClass() {
            const { x } = this.interactPosition;
            if (x > 0) return "positive";
            if (x < 0) return "negative";
            return "";
        }
    },
    mounted() {
        const element = this.$refs.interactElement;

        interact(element).draggable({
            onstart: () => {
                this.isInteractAnimating = false;
                this.isInteractDragged = true;
            },
            onmove: event => {
                const {
                    interactMaxRotation,
                    interactXThreshold
                } = this.$options.static;
                const x = this.interactPosition.x + event.dx;
                const y = this.interactPosition.y + event.dy;

                let rotation = interactMaxRotation * (x / interactXThreshold);

                if (rotation > interactMaxRotation) rotation = interactMaxRotation;
                else if (rotation < -interactMaxRotation)
                    rotation = -interactMaxRotation;

                this.interactSetPosition({ x, y, rotation });
            },
            onend: () => {
                const { x, y } = this.interactPosition;
                const { interactXThreshold, interactYThreshold } = this.$options.static;
                this.isInteractAnimating = true;
                this.isInteractDragged = false;

                if (x > interactXThreshold) this.playCard(ACCEPT_CARD);
                else if (x < -interactXThreshold) this.playCard(REJECT_CARD);
                else if (y > interactYThreshold) this.playCard(SKIP_CARD);
                else this.resetCardPosition();
            }
        });
    },
    beforeUnmount() {
        interact(this.$refs.interactElement).unset();
    },
    methods: {
        hideCard() {
            setTimeout(() => {
                this.isShowing = false;
                this.$emit("hideCard", this.card);
            }, 300);
        },
        playCard(interaction) {
            const {
                interactOutOfSightXCoordinate,
                interactOutOfSightYCoordinate,
                interactMaxRotation
            } = this.$options.static;

            this.interactUnsetElement();

            switch (interaction) {
                case ACCEPT_CARD:
                    this.interactSetPosition({
                        x: interactOutOfSightXCoordinate,
                        rotation: interactMaxRotation
                    });
                    this.$emit(ACCEPT_CARD, this.card);
                    break;
                case REJECT_CARD:
                    this.interactSetPosition({
                        x: -interactOutOfSightXCoordinate,
                        rotation: -interactMaxRotation
                    });
                    this.$emit(REJECT_CARD, this.card);
                    break;
                case SKIP_CARD:
                    this.interactSetPosition({
                        y: interactOutOfSightYCoordinate
                    });
                    this.$emit(SKIP_CARD, this.card);
                    break;
            }

            this.hideCard();
        },
        interactSetPosition(coordinates) {
            const { x = 0, y = 0, rotation = 0 } = coordinates;
            this.interactPosition = { x, y, rotation };
        },
        interactUnsetElement() {
            interact(this.$refs.interactElement).unset();
            this.isInteractDragged = true;
        },
        resetCardPosition() {
            this.interactSetPosition({ x: 0, y: 0, rotation: 0 });
        },
        playAudio() {
            const audioElement = this.$refs.audio;
            if (this.isPlaying) {
                audioElement.pause();
            } else {
                audioElement.play();
            }
            this.isPlaying = !this.isPlaying;
        }
    }
};
</script>

<style scoped>
.card {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    position: absolute;
    width: 90vw;
    max-width: 300px;
    height: 65vh;
    max-height: 600px;
    border-radius: 15px;
    background: #1e1e1e;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    color: #ffffff;
    opacity: 0;
    transform: translateY(calc(55vh * 0.06 * 3)) scale(1 - (0.08 * 3));
    transform-origin: 50% 100%;
    user-select: none;
    pointer-events: none;
    will-change: transform, opacity;
}

@media (max-width: 600px) {
    .card {
        padding: 0.5rem;
        width: 40vw;
        height: 60vw;
    }

    .card .album-art {
        width: 20vw;
        height: auto;
    }

    .card .cardTitle {
        font-size: 1rem;
        font-weight: bold;
    }

    .card .cardArtist {
        font-size: 0.5rem;
    }

    .card .audioControls span {
        font-size: 0.5rem;
        padding: 0;
    }

    .card .play-button {
        padding: 0.25rem;
        padding-left: 0.5rem;
        padding-right: 0.5rem;
    }

    .card .user-photo {
        width: 25px;
        height: 25px;
    }

    .card .user-name {
        font-size: 0.7rem;
    }
}

.card.isCurrent {
    pointer-events: auto;
}

.card.isAnimating {
    transition: transform 0.7s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.cardInfo {
    text-align: center;
}

.cardTitle {
    font-size: 1.25rem;
}

.cardArtist {
    font-size: 0.8rem;
    color: #b3b3b3;
}

.userInfo {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
}

.user-photo {
    width: 30px;
    height: 30px;
    border-radius: 50%;
}

.user-name {
    font-size: 0.7rem;
    color: #b3b3b3;
}

.album-art {
    width: 200px;
    height: 200px;
    border-radius: 10px;
}

.card:nth-child(1) {
    z-index: 3;
    opacity: 1;
    transform: translateY(0) scale(1);
}

.card:nth-child(2) {
    z-index: 2;
    opacity: 1;
    transform: translateY(10px) scale(0.95);
}

.card:nth-child(3) {
    z-index: 1;
    opacity: 1;
    transform: translateY(20px) scale(0.9);
}

.card:nth-child(4) {
    z-index: 0;
    opacity: 1;
    transform: translateY(30px) scale(0.85);
}

.interaction-indicator {
    position: absolute;
    top: 20px;
    font-size: 2rem;
    font-weight: bold;
    color: #fff;
    opacity: 0.8;
    z-index: 10;
}

.interaction-indicator.positive {
    right: 20px;
    color: #1db954;
}

.interaction-indicator.negative {
    left: 20px;
    color: #e0245e;
}

.play-button {
    font-size: 0.8rem;
    padding: 0.5rem 2rem 0.5rem 2rem;
}
</style>
