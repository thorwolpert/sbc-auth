<template>
  <v-container>
    <UserManagement
      v-if="!isAnonymousAccount()"
     ></UserManagement>
    <AnonymousUserManagement
        v-if="isAnonymousAccount()"
    ></AnonymousUserManagement>
  </v-container>
</template>

<script lang="ts">
import { AccessType, Account } from '@/util/constants'
import { Component, Mixins, Prop, Vue } from 'vue-property-decorator'
import { Member, MembershipStatus, MembershipType, Organization } from '@/models/Organization'
import { mapActions, mapState } from 'vuex'
import AnonymousUserManagement from '@/components/auth/AnonymousUserManagement.vue'
import { Event } from '@/models/event'
import NextPageMixin from '@/components/auth/mixins/NextPageMixin.vue'
import OrgModule from '@/store/modules/org'
import UserManagement from '@/components/auth/UserManagement.vue'
import { getModule } from 'vuex-module-decorators'

@Component({
  components: {
    UserManagement,
    AnonymousUserManagement
  },
  computed: {
    ...mapState('org', [
      'currentMembership',
      'currentOrganization'
    ])
  },
  methods: {

  }
})
export default class TeamManagement extends Mixins(NextPageMixin) {
  @Prop({ default: '' }) private orgId: string;

  private async mounted () {
    // redirect to dir search/team management according to dir search user role change
    if (this.isAnonymousAccount()) {
      this.redirectTo(this.getNextPageUrl())
    }
  }
  private isAnonymousAccount (): boolean {
    return this.currentOrganization &&
            this.currentOrganization.accessType === AccessType.ANONYMOUS
  }
}
</script>

<style lang="scss" scoped>

</style>
