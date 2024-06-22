<template>
    <div class="cards">
        <CardItem v-for="(card, index) in cards" :key="card" :card="card" :is-current="index === 0" :position="index"
            @cardAccepted="$emit('cardAccepted', card);" @cardRejected="$emit('cardRejected', card);"
            @cardSkipped="$emit('cardSkipped', card);" @hideCard="$emit('hideCard');" />
        <button @click="close">↪️ Close</button>
    </div>
</template>

<script>
import CardItem from "@/components/CardItem.vue";

export default {
    components: {
        CardItem
    },
    props: {
        cards: {
            type: Array,
            required: true
        }
    },
    methods: {
        close() {
            this.$router.replace({ path: '/results' });
        }
    }
};
</script>

<style scoped>
.cards {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
}
</style>