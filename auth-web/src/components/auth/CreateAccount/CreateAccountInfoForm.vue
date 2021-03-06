<template>
  <v-form ref="createAccountInfoForm" lazy-validation>
    <account-premium-create v-if="isPremium()" :stepForward="stepForward" :stepBack="stepBack"></account-premium-create>
    <account-basic-create v-if="!isPremium()" :stepForward="stepForward" :stepBack="stepBack"></account-basic-create>
  </v-form>
</template>

<script lang="ts">

import { BcolAccountDetails, BcolProfile } from '@/models/bcol'
import { Component, Mixins, Prop, Vue } from 'vue-property-decorator'
import { CreateRequestBody, Member, Organization } from '@/models/Organization'
import { mapActions, mapState } from 'vuex'
import { Account } from '@/util/constants'
import AccountBasicCreate from '@/components/auth/CreateAccount/AccountCreateBasic.vue'
import AccountPremiumCreate from '@/components/auth/CreateAccount/AccountCreatePremium.vue'
import { KCUserProfile } from 'sbc-common-components/src/models/KCUserProfile'
import OrgModule from '@/store/modules/org'
import Steppable from '@/components/auth/stepper/Steppable.vue'
import { getModule } from 'vuex-module-decorators'

@Component({
  components: {
    AccountPremiumCreate,
    AccountBasicCreate
  },
  computed: {
    ...mapState('org', ['currentOrganization']),
    ...mapState('user', ['userProfile', 'currentUser'])
  },
  methods: {
    ...mapActions('org', ['createOrg', 'syncMembership', 'syncOrganization'])
  }
})
export default class CreateAccountInfoForm extends Mixins(Steppable) {
    private orgStore = getModule(OrgModule, this.$store)
    private username = ''
    private password = ''
    private errorMessage: string = ''
    private saving = false
    private readonly createOrg!: (requestBody: CreateRequestBody) => Promise<Organization>
    private readonly syncMembership!: (orgId: number) => Promise<Member>
    private readonly syncOrganization!: (orgId: number) => Promise<Organization>
    private readonly currentOrganization!: Organization
    private readonly currentUser!: KCUserProfile

    $refs: {
      createAccountInfoForm: HTMLFormElement
    }

    private readonly teamNameRules = [
      v => !!v || 'An account name is required']

    private isFormValid (): boolean {
      return !!this.username && !!this.password
    }

    private isPremium () {
      return this.currentOrganization.orgType === Account.PREMIUM
    }

    private redirectToNext (organization?: Organization) {
      this.$router.push({ path: `/account/${organization.id}/` })
    }
}
</script>

<style lang="scss" scoped>
  @import '$assets/scss/theme.scss';

  // Tighten up some of the spacing between rows
  [class^="col"] {
    padding-top: 0;
    padding-bottom: 0;
  }

  .form__btns {
    display: flex;
    justify-content: flex-end;
  }

  .bcol-acc-label {
    font-size: 1.35rem;
    font-weight: 600;
  }

  .grant-access {
    font-size: 1rem !important;
  }
</style>
