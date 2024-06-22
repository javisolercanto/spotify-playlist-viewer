<template>
    <div class="voteview-container">
        <CardStack :cards="visibleCards" @cardAccepted="handleCardAccepted" @cardRejected="handleCardRejected"
            @cardSkipped="handleCardSkipped" @hideCard="removeCardFromDeck" />
    </div>
</template>

<script>
import CardStack from "@/components/CardStack.vue";
import { supabase } from '@/utils/supabase';


export default {
    name: "VoteView",
    components: {
        CardStack
    },
    data() {
        return {
            visibleCards: localStorage.getItem('playlist') ? JSON.parse(localStorage.getItem('playlist')).tracks.items.sort((a, b) => new Date(a.added_at) - new Date(b.added_at)) : []
        };
    },
    created() {
        if (new Date().getDay() != process.env.VUE_APP_VOTATION_DAY) {
            return this.$router.push({ path: '/results', replace: true });
        }

        const userId = JSON.parse(localStorage.getItem('user')).id;

        supabase
            .from('election')
            .insert([{ user_token: userId }]).then();
    },
    methods: {
        async handleCardAccepted(card) {
            await this.updateVote(card, card.track.id, 1);
        },
        async handleCardRejected(card) {
            await this.updateVote(card, card.track.id, -1);
        },
        handleCardSkipped() {
        },
        removeCardFromDeck() {
            this.visibleCards.shift();
        },
        async updateVote(card, trackId, voteChange) {
            const { data, error } = await supabase
                .from('votes')
                .select('id, votes')
                .eq('track_id', trackId)
                .single();

            if (error && error.code === 'PGRST116') {
                const { error: insertError } = await supabase
                    .from('votes')
                    .insert([{ track_id: trackId, votes: voteChange, added_by_name: card.added_by_name, added_by_image: card.added_by_image }]);

                if (insertError) {
                    console.error('Error inserting vote:', insertError);
                }
            } else if (data) {
                const { error: updateError } = await supabase
                    .from('votes')
                    .update({ votes: data.votes + voteChange })
                    .eq('id', data.id);

                if (updateError) {
                    console.error('Error updating vote:', updateError);
                }
            } else {
                console.error('Error fetching vote:', error);
            }
        }
    }
};
</script>

<style>
.voteview-container {
    margin: 0;
    height: 100%;
    overflow: hidden;

    padding: 20px;
    background-color: #121212;
    color: white;
    min-height: 80vh;

    display: flex;
    align-items: center;
    justify-content: center;
}
</style>