<template>
  <v-simple-table>
    <thead>
      <tr>
        <th
          scope="col"
          class="text-left"
        >
          Id
        </th>
        <th
          scope="col"
          class="text-left"
        >
          Email
        </th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="item in safeEmails"
        :key="item.email"
      >
        <td>{{ item.id }}</td>
        <td>{{ item.email }}</td>
        <td>
          <v-btn
            small
            @click="deleteEmail(item.email)"
          >
            Delete
          </v-btn>
        </td>
      </tr>
    </tbody>
  </v-simple-table>
</template>
<script lang="ts">
import { defineComponent, onMounted, ref } from '@vue/composition-api'
import { SafeEmail } from '@/models/safe-email'
import StaffService from '@/services/staff.services'

export default defineComponent({
  name: 'SafeEmailView',
  setup () {
    const safeEmails = ref<SafeEmail[]>()

    async function getSafeEmails () {
      // Call to get the email list from the server
      try {
        const response = await StaffService.getSafeEmails()
        if (response?.data && response.status === 200) {
          safeEmails.value = response.data
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`Unable to get the email list, ${error}`)
      }
    }

    async function deleteEmail (email: string) {
      // Call the service method to delete the email from the server
      try {
        await StaffService.deleteSafeEmail(email)
        await getSafeEmails()
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`Unable to delete the email, ${error}`)
      }
    }

    onMounted(async () => {
      await getSafeEmails()
    })

    return {
      deleteEmail,
      getSafeEmails,
      safeEmails
    }
  }
})
</script>
