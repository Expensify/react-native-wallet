import type {CardStatus} from './NativeWallet';

function getCardState(stateId: number): CardStatus {
  switch (stateId) {
    case 0:
      return 'not found';
    case 1:
      return 'requireActivation';
    case 2:
      return 'pending';
    case 3:
      return 'active';
    case 4:
      return 'suspended';
    case 5:
      return 'deactivated';
    default:
      throw new Error(`Unknown card state: ${stateId}`);
  }
}

// eslint-disable-next-line import/prefer-default-export
export {getCardState};
