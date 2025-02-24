<template>
  <div>
    <v-data-table
      class="user-list"
      :headers="headerAccounts"
      :items="pendingInvitationOrgs"
      :items-per-page.sync="numberOfItems"
      :hide-default-footer="pendingInvitationOrgs.length <= tableDataOptions.itemsPerPage"
      :custom-sort="columnSort"
      :no-data-text="$t('noPendingAccountsLabel')"
      :footer-props="{
        itemsPerPageOptions: getPaginationOptions
      }"
      :options.sync="tableDataOptions"
      @update:items-per-page="saveItemsPerPage"
    >
      <template #loading>
        Loading...
      </template>
      <template #[`item.expires`]="{ item }">
        {{ formatDate(item.invitations[0]?.expiresOn, 'MMM DD, YYYY') }}
      </template>
      <template #[`item.contactEmail`]="{ item }">
        <!-- {{item.invitations[0].recipientEmail}} -->
        <a :href="'mailto:' + item.invitations[0]?.recipientEmail">
          {{ item.invitations[0]?.recipientEmail }}
        </a>
      </template>
      <template #[`item.action`]="{ item }">
        <div class="table-actions">
          <v-btn
            v-can:EDIT_USER.hide
            outlined
            color="primary"
            class="action-btn"
            :data-test="getIndexedTag('resend-invitation-button', item.id)"
            @click="resend(item.invitations[0])"
          >
            Resend
          </v-btn>
          <v-btn
            v-can:EDIT_USER.hide
            outlined
            color="primary"
            class="action-btn"
            @click="showConfirmRemoveInviteModal(item)"
          >
            Remove
          </v-btn>
        </div>
      </template>
    </v-data-table>
    <ModalDialog
      ref="confirmActionDialog"
      dialog-class="notify-dialog"
      max-width="640"
    >
      <template #title>
        <span>Remove Invitation</span>
      </template>
      <template #text>
        <span>
          This invitation for this account will be removed permanently.
          Are you sure you want to remove this invitation?
        </span>
      </template>
      <template #icon>
        <v-icon
          large
          color="error"
        >
          mdi-alert-circle-outline
        </v-icon>
      </template>
      <template #actions>
        <v-btn
          large
          color="error"
          @click="deleteInvitation()"
        >
          Yes
        </v-btn>
        <v-btn
          large
          color="default"
          @click="close()"
        >
          No
        </v-btn>
      </template>
    </ModalDialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, ref, toRefs } from '@vue/composition-api'
import CommonUtils from '@/util/common-util'
import { Event } from '@/models/event'
import { EventBus } from '@/event-bus'
import { Invitation } from '@/models/Invitation'
import ModalDialog from '@/components/auth/common/ModalDialog.vue'
import { Organization } from '@/models/Organization'
import PaginationMixin from '@/components/auth/mixins/PaginationMixin.vue'
import { useStaffStore } from '@/stores/staff'

export default defineComponent({
  name: 'StaffPendingAccountInvitationsTable',
  components: {
    ModalDialog
  },
  mixins: [PaginationMixin],
  setup () {
    const formatDate = CommonUtils.formatDisplayDate
    const columnSort = CommonUtils.customSort

    const confirmActionDialog = ref<InstanceType<typeof ModalDialog>>()
    const state = reactive({
      orgToBeRemoved: null,
      tableDataOptions: {}
    })
    const { pendingInvitationOrgs, resendPendingOrgInvitation, syncPendingInvitationOrgs, deleteOrg } = useStaffStore()

    const headerAccounts = [
      {
        text: 'Expiry Date',
        align: 'left',
        value: 'expires',
        sortable: false,
        width: '150'
      },
      {
        text: 'Name',
        align: 'left',
        sortable: false,
        value: 'name'
      },
      {
        text: 'Contact Email',
        align: 'left',
        sortable: false,
        value: 'contactEmail'
      },
      {
        text: 'Created By',
        align: 'left',
        sortable: false,
        value: 'createdBy'
      },
      {
        text: 'Actions',
        align: 'left',
        value: 'action',
        sortable: false,
        width: '210'
      }
    ]

    function getIndexedTag (tag, index): string {
      return `${tag}-${index}`
    }

    async function resend (invitation: Invitation) {
      try {
        await resendPendingOrgInvitation(invitation)
        const event:Event = { message: `Invitation resent to ${invitation.recipientEmail}`, type: 'success', timeout: 1000 }
        EventBus.$emit('show-toast', event)
      } catch (err) {
        const event:Event = { message: 'Invitation resend failed', type: 'error', timeout: 1000 }
        EventBus.$emit('show-toast', event)
      }

      await syncPendingInvitationOrgs()
    }

    async function deleteInvitation () {
      try {
        await deleteOrg(state.orgToBeRemoved)
        close()
        const event:Event = { message: 'Invitation removed', type: 'success', timeout: 1000 }
        EventBus.$emit('show-toast', event)
        await syncPendingInvitationOrgs()
      } catch (err) {
        const event:Event = { message: 'Invitation remove failed', type: 'error', timeout: 1000 }
        EventBus.$emit('show-toast', event)
      }
    }

    function showConfirmRemoveInviteModal (org: Organization) {
      state.orgToBeRemoved = org
      confirmActionDialog.value.open()
    }

    function close () {
      confirmActionDialog.value.close()
    }

    return {
      ...toRefs(state),
      pendingInvitationOrgs,
      resendPendingOrgInvitation,
      syncPendingInvitationOrgs,
      deleteOrg,
      headerAccounts,
      formatDate,
      getIndexedTag,
      resend,
      deleteInvitation,
      showConfirmRemoveInviteModal,
      close,
      columnSort,
      confirmActionDialog
    }
  }
})
</script>

<style lang="scss" scoped>
::v-deep {
  table {
    table-layout: fixed;

    td {
      padding-top: 0.5rem;
      padding-bottom: 0.5rem;
    }
  }
}

.table-actions {
  .v-btn + .v-btn {
    margin-left: 0.25rem;
  }
}
</style>
