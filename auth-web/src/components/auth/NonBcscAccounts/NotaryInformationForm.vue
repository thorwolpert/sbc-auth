<template>
  <v-form ref="notaryInformationForm" lazy-validation>
    <fieldset v-if="notaryInfo">
      <legend class="mb-4">Notary Information</legend>
      <v-row>
        <v-col cols="12" class="py-0">
          <v-text-field
            filled
            label="Name of Notary"
            :rules="rules.notaryName"
            :disabled="disabled"
            v-model.trim="notaryInfo.notaryName"
          >
          </v-text-field>
        </v-col>
      </v-row>
      <BaseAddress v-if="address"
              v-bind:inputAddress="address"
              @address-update="updateAddress"
              @is-form-valid="checkBaseAddressValidity" :key="addressJson"
      >
      </BaseAddress>
    </fieldset>
  </v-form>
</template>

<script lang="ts">
import { Component, Emit, Prop, Vue, Watch } from 'vue-property-decorator'
import { Address } from '@/models/address'
import BaseAddress from '@/components/auth/BaseAddress.vue'
import { NotaryInformation } from '@/models/notary'

@Component({
  components: {
    BaseAddress
  }
})
export default class NotaryInformationForm extends Vue {
  @Prop() inputNotaryInfo: NotaryInformation
  @Prop({ default: false }) disabled: boolean
  private notaryInfo: NotaryInformation = {}
  private isBaseAddressValid: boolean = false
  private address:Address = {}

  $refs: {
    notaryInformationForm: HTMLFormElement,
  }

  private readonly rules = {
    notaryName: [v => !!v || 'Name of Notary is required']
  }

  private updateAddress (address: Address) {
    this.notaryInfo.address = address
    return this.emitNotaryInformation()
  }

  get addressJson () {
    // TODO fix the reactivity issue
    return JSON.stringify(this.address)
  }

  mounted () {
    if (this.inputNotaryInfo) {
      Object.keys(this.inputNotaryInfo)
        .filter(key => key !== 'address')
        .forEach(key => {
          this.$set(this.notaryInfo, key, this.inputNotaryInfo?.[key])
        })
      Object.keys(this.inputNotaryInfo.address).forEach(key => {
        this.$set(this.address, key, this.inputNotaryInfo?.address?.[key])
      })
    }
  }

  @Watch('notaryInfo', { deep: true })
  async updateNotary (val, oldVal) {
    this.emitNotaryInformation()
  }

  @Emit('notaryinfo-update')
  emitNotaryInformation () {
    this.isFormValid()
    return this.notaryInfo
  }

  private checkBaseAddressValidity (isValid) {
    this.isBaseAddressValid = !!isValid
  }

  @Emit('is-form-valid')
  isFormValid () {
    return this.$refs.notaryInformationForm.validate() && this.isBaseAddressValid
  }
}
</script>

<style lang="scss" scoped></style>
