import React from 'react'

import { PermissionsSection as PermissionsSectionComponent } from '../../../components/project/PermissionsSection'

export default {
  title: 'Components/Project/PermissionsSection',
}

export function PermissionsSection() {
  return (
    <div className="leading-normal p-4">
      <PermissionsSectionComponent
        permissions={[
          {
            name: 'Optimism MultiSig',
            accounts: [
              {
                address: '0x9BA6e03D8B90dE867373Db8cF1A58d2F7F006b3A',
                type: 'MultiSig',
              },
            ],
            description:
              'This address is the owner of the following contracts: OVM_L1CrossDomainMessenger, L1StandardBridge, LibAddressManager. This allows it to censor messages or pause message bridge altogether, upgrade bridge implementation potentially gaining access to all funds stored in a bridge and change the sequencer, state root proposer or any other system component (unlimited upgrade power).',
          },
          {
            name: 'MultiSig participants',
            accounts: [
              {
                address: '0x3041BA32f451F5850c147805F5521AC206421623',
                type: 'EOA',
              },
              {
                address: '0x3bC453E5b3c941D1baD8F25E512772a50eE20AC1',
                type: 'EOA',
              },
              {
                address: '0x4D014f3c5F33Aa9Cd1Dc29ce29618d07Ae666d15',
                type: 'EOA',
              },
            ],
            description:
              'These addresses are the participants of the 2/3 Optimism MultiSig.',
          },
        ]}
      />
    </div>
  )
}
