<template>
  <v-container>
    <header class="view-header align-center">
      <h2 class="view-header__title">Team Members</h2>
      <div class="view-header__actions">
        <v-btn
          large
          color="primary"
          v-can:INVITE_MEMBERS.hide
          @click="showAddUsersModal()"
          data-test="add-people-button"
        >
          <v-icon small>mdi-plus</v-icon>
          <span>Add Team Member</span>
        </v-btn>
      </div>
    </header>

    <!-- Team member listing -->
    <MemberDataTable
      @confirm-remove-member="
        showConfirmRemoveModal($event, $refs.confirmActionDialog)
      "
      @confirm-change-role="
        showConfirmChangeRoleModal(
          $event,
          $refs.confirmActionDialogWithQuestion
        )
      "
      @reset-password="showResetPasswordModal($event)"
      @confirm-leave-team="showConfirmLeaveTeamModal($refs.confirmActionDialog)"
      @confirm-dissolve-team="
        showConfirmDissolveModal($refs.confirmActionDialog)
      "
      @single-owner-error="showSingleOwnerErrorModal($refs.errorDialog)"
    />

    <!-- Add Users Dialog -->
    <ModalDialog
      ref="addAnonUsersDialog"
      :show-icon="false"
      :show-actions="false"
      :fullscreen-on-mobile="
        $vuetify.breakpoint.xsOnly ||
          $vuetify.breakpoint.smOnly ||
          $vuetify.breakpoint.mdOnly
      "
      :is-persistent="true"
      :is-scrollable="true"
      max-width="800"
    >
      <template v-slot:title>
        <span>Add Team Members</span>
      </template>
      <template v-slot:text>
        <AddUsersForm
          @add-users-complete="showSuccessModal()"
          @cancel="close($refs.addAnonUsersDialog)"
        />
      </template>
    </ModalDialog>

    <!-- Add Users Dialog -->
    <ModalDialog
            ref="passwordResetDialog"
            :show-icon="false"
            :show-actions="false"
            :fullscreen-on-mobile="
        $vuetify.breakpoint.xsOnly ||
          $vuetify.breakpoint.smOnly ||
          $vuetify.breakpoint.mdOnly
      "
            :is-persistent="true"
            :is-scrollable="true"
            max-width="800"
    >
      <template v-slot:title>
        <span>Reset Password</span>
      </template>
      <template v-slot:text>
        <PasswordReset v-bind:user="user"
                       ref="passwordResetComp"
                @reset-complete="showUpdateModal()"
                @reset-error="showPasswordResetErrorModal()"
                       @cancel="close($refs.passwordResetDialog)"
        />
      </template>
    </ModalDialog>

    <PasswordReset
      ref="passwordResetComp"
      @reset-complete="showUpdateModal()"
      @reset-error="showPasswordResetErrorModal()"
    />

    <!-- Password Reset Success Modal -->
    <ModalDialog
            ref="passwordResetSuccessDialog"
            :title="successTitle"
            dialog-class="notify-dialog"
            max-width="640"
            :show-icon="true"
    >
      <template v-slot:actions>
        <v-btn large color="primary" @click="close($refs.passwordResetSuccessDialog)"
        >OK</v-btn
        >
      </template>

      <template v-slot:icon>
        <v-icon large color="success">mdi-check</v-icon>
      </template>

      <template v-slot:text>
        <AddUsersSuccess ref="addUserSuccessRef" v-bind:action="action"/>
      </template>
    </ModalDialog>

    <!-- Add Users Success Modal -->
    <ModalDialog
      ref="addUsersSuccessDialog"
      :title="successTitle"
      dialog-class="notify-dialog"
      max-width="640"
    >
      <template v-slot:actions>
        <v-btn large color="primary" @click="close($refs.addUsersSuccessDialog)"
          >OK</v-btn
        >
      </template>

      <template v-slot:icon v-if="!createdUsers.length && failedUsers.length">
        <v-icon large color="error">mdi-alert-circle-outline</v-icon>
      </template>

      <template v-slot:text>
        <AddUsersSuccess ref="addUserSuccessRef" />
      </template>
    </ModalDialog>

    <!-- Confirm Action Dialog -->
    <ModalDialog
      ref="confirmActionDialog"
      :title="confirmActionTitle"
      :text="confirmActionText"
      dialog-class="notify-dialog"
      max-width="640"
    >
      <template v-slot:icon>
        <v-icon large color="error">mdi-alert-circle-outline</v-icon>
      </template>
      <template v-slot:actions>
        <v-btn large color="primary" @click="confirmHandler()">{{
          primaryActionText
        }}</v-btn>
        <v-btn
          large
          color="default"
          @click="close($refs.confirmActionDialog)"
          >{{ secondaryActionText }}</v-btn
        >
      </template>
    </ModalDialog>

    <!-- Confirm Action Dialog With Email Question-->
    <ModalDialog
      ref="confirmActionDialogWithQuestion"
      :title="confirmActionTitle"
      :text="confirmActionText"
      dialog-class="notify-dialog"
      max-width="640"
    >
      <template v-slot:icon>
        <v-icon large color="primary">mdi-information-outline</v-icon>
      </template>
      <template v-slot:text>
        {{ confirmActionText }}
      </template>
      <template v-slot:actions>
        <v-btn large color="primary" @click="confirmHandler()">{{
          primaryActionText
        }}</v-btn>
        <v-btn
          large
          color="default"
          @click="close($refs.confirmActionDialogWithQuestion)"
          >{{ secondaryActionText }}</v-btn
        >
      </template>
    </ModalDialog>

    <!-- Alert Dialog (Success) -->
    <ModalDialog
      ref="successDialog"
      :title="successTitle"
      :text="successText"
      dialog-class="notify-dialog"
      max-width="640"
    ></ModalDialog>

    <!-- Alert Dialog (Error) -->
    <ModalDialog
      ref="errorDialog"
      :title="errorTitle"
      :text="errorText"
      dialog-class="notify-dialog"
      max-width="640"
    >
      <template v-slot:icon>
        <v-icon large color="error">mdi-alert-circle-outline</v-icon>
      </template>
      <template v-slot:actions>
        <v-btn large color="error" @click="close($refs.errorDialog)">OK</v-btn>
      </template>
    </ModalDialog>
  </v-container>
</template>

<script lang="ts">
import {
  BulkUsersFailed,
  BulkUsersSuccess,
  Member
} from '@/models/Organization'
import { Component, Mixins, Prop } from 'vue-property-decorator'
import { mapActions, mapState } from 'vuex'
import AddUsersForm from '@/components/auth/AddUsersForm.vue'
import AddUsersSuccess from '@/components/auth/AddUsersSuccess.vue'
import MemberDataTable from '@/components/auth/MemberDataTable.vue'
import ModalDialog from '@/components/auth/ModalDialog.vue'
import PasswordReset from '@/components/auth/PasswordReset.vue'
import TeamManagementMixin from '@/components/auth/mixins/TeamManagementMixin.vue'
import { User } from '../../models/user'

@Component({
  components: {
    PasswordReset,
    MemberDataTable,
    ModalDialog,
    AddUsersForm,
    AddUsersSuccess
  },
  computed: {
    ...mapState('org', ['createdUsers', 'failedUsers'])
  },
  methods: {
    ...mapActions('org', ['syncActiveOrgMembers'])
  }
})
export default class AnonymousUserManagement extends Mixins(
  TeamManagementMixin
) {
  @Prop({ default: '' }) private orgId: string
  // @Prop() private confirmActionDialogWithQuestion: ModalDialog;

  private isLoading = true

  private readonly syncActiveOrgMembers!: () => Member[]
  private readonly createdUsers!: BulkUsersSuccess[]
  private readonly failedUsers!: BulkUsersFailed[]
  private user: User = { firstname: '', lastname: '', username: '' }
  private action = ''

  $refs: {
    successDialog: ModalDialog
    errorDialog: ModalDialog
    confirmActionDialog: ModalDialog
    confirmActionDialogWithQuestion: ModalDialog
    addAnonUsersDialog: ModalDialog
    addUsersSuccessDialog: ModalDialog
    passwordResetDialog: ModalDialog
    passwordResetSuccessDialog: ModalDialog
  }

  private async mounted () {
    this.isLoading = false
    await this.syncActiveOrgMembers()
  }

  private showAddUsersModal () {
    this.$refs.addAnonUsersDialog.open()
  }

  private cancelAddUsersModal () {
    this.$refs.addAnonUsersDialog.close()
  }

  protected showPasswordResetErrorModal () {
    this.$refs.passwordResetDialog.close()
    this.errorTitle = this.$t('passwordResetFailureTitle').toString()
    this.errorText = this.$t('passwordResetFailureText').toString()
    this.$refs.errorDialog.open()
  }

  private showResetPasswordModal (payload: User) {
    this.user = payload
    this.$refs.passwordResetDialog.open()
  }

  private showUpdateModal () {
    this.$refs.passwordResetDialog.close()
    this.action = 'resetpassword'
    this.successTitle = `Password Reset`
    this.$refs.passwordResetSuccessDialog.open()
  }

  private showSuccessModal () {
    this.$refs.addAnonUsersDialog.close()
    this.successTitle = `${this.createdUsers.length} Team Members Added`
    if (this.createdUsers.length) {
      this.successTitle = `${this.createdUsers.length} of ${this.failedUsers
        .length + this.createdUsers.length} Team Members Added`
    }
    this.$refs.addUsersSuccessDialog.open()
  }
}
</script>

<style lang="scss" scoped>
.view-header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}
.v-text-field {
  margin: 2px;
}

::v-deep {
  .v-data-table td {
    padding-top: 1rem;
    padding-bottom: 1rem;
    height: auto;
    vertical-align: top;
  }

  .v-list-item__title {
    display: block;
    font-weight: 700;
  }

  .v-badge--inline .v-badge__wrapper {
    margin-left: 0;

    .v-badge__badge {
      margin-right: -0.25rem;
      margin-left: 0.25rem;
    }
  }
}
</style>
