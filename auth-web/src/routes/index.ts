import { Account, LoginSource, Pages, Role, SessionStorageKeys } from '@/util/constants'
import { Member, MembershipStatus, MembershipType, OrgStatus, Organization } from '@/models/Organization'
import Router, { Route } from 'vue-router'
import { AccountSettings } from '@/models/account-settings'
import { Contact } from '@/models/contact'
import { KCUserProfile } from 'sbc-common-components/src/models/KCUserProfile'
import KeyCloakService from 'sbc-common-components/src/services/keycloak.services'
import { User } from '@/models/user'
import Vue from 'vue'
import store from '@/store'

Vue.use(Router)

function mapReturnPayVars (route: any) {
  return {
    paymentId: route.params.paymentId,
    transactionId: route.params.transactionId,
    receiptNum: !route.query.receipt_number ? '' : route.query.receipt_number
  }
}

const router = new Router({
  mode: 'history',
  base: process.env.BASE_URL
})

router.beforeEach((to, from, next) => {
  // If the user is authenticated;
  //    If there are allowed or disabled roles specified on the route check if the user has those roles else route to unauthorized
  // If the user is not authenticated
  //    Redirect the user to login page to login page
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (sessionStorage.getItem(SessionStorageKeys.KeyCloakToken)) {
      if (!KeyCloakService.verifyRoles(to.meta.allowedRoles, to.meta.disabledRoles)) {
        return next({
          path: '/unauthorized',
          query: { redirect: to.fullPath }
        })
      }
    } else {
      if (to.meta.allowedRoles?.length === 1 && to.meta.allowedRoles[0] === Role.Staff) {
        return next({
          path: `/signin/idir${to.path}`,
          query: { redirect: to.fullPath }
        })
      }
      return next({
        path: '/unauthorized',
        query: { redirect: to.fullPath }
      })
    }
    if (to.matched.some(record => record.meta.isPremiumOnly)) {
      const currentOrganization: Organization = (store.state as any)?.org?.currentOrganization
      const currentMembership: Member = (store.state as any)?.org?.currentMembership
      // redirect to unauthorized page if the account selected is not Premium
      if (!(currentOrganization?.orgType === Account.PREMIUM &&
        [MembershipType.Admin, MembershipType.Coordinator].includes(currentMembership.membershipTypeCode))) {
        return next({
          path: '/unauthorized',
          query: { redirect: to.fullPath }
        })
      }
    }
  }

  // Enforce navigation guards are checked before navigating anywhere else
  // If store is not ready, we place a watch on it, then proceed when ready
  if (store.getters.loading) {
    store.watch(
      (state, getters) => getters.loading,
      value => {
        if (value === false) {
          proceed(to)
        }
      })
  } else {
    proceed()
  }

  function proceed (originalTarget?: Route) {
    const userContact: Contact = (store.state as any)?.user?.userContact
    const userProfile: User = (store.state as any)?.user?.userProfile
    const currentAccountSettings: AccountSettings = (store.state as any)?.org.currentAccountSettings
    const currentOrganization: Organization = (store.state as any)?.org?.currentOrganization
    const currentMembership: Member = (store.state as any)?.org?.currentMembership
    const currentUser: KCUserProfile = (store.state as any)?.user?.currentUser
    if (to.matched.some(record => record.meta.requiresProfile) &&
      !userProfile?.userTerms?.isTermsOfUseAccepted) {
      switch (currentUser?.loginSource) {
        case LoginSource.BCSC:
        case LoginSource.BCROS:
        case LoginSource.BCEID:
          return next({
            path: `/${Pages.USER_PROFILE_TERMS}`
          })
        default:
          return next({
            path: '/'
          })
      }
    }

    if (to.matched.some(record => record.meta.requiresActiveAccount) && (currentUser.loginSource === LoginSource.BCSC || currentUser.loginSource === LoginSource.BCEID)) {
      const isTheOrgPendingAffidavitReview = currentOrganization?.statusCode === OrgStatus.PendingAffidavitReview
      if (isTheOrgPendingAffidavitReview) {
        return next({ path: `/${Pages.PENDING_APPROVAL}/${currentAccountSettings?.label}` }) // TODO put the account name back once its avaialable ;may be needs a fix in sbc-common
      } else if (currentAccountSettings && currentMembership.membershipStatus === MembershipStatus.Pending) {
        return next({ path: `/${Pages.PENDING_APPROVAL}/${currentAccountSettings?.label}` })
      } else if (!currentOrganization || currentMembership.membershipStatus !== MembershipStatus.Active) {
        return next({ path: `/${Pages.CREATE_ACCOUNT}` })
      }
    }
    originalTarget ? next(originalTarget) : next()
  }
})

export default router
