import type {CardStatus} from './NativeWallet';

function getCardState(stateId: number): CardStatus {
  switch (stateId) {
    case -1:
      return 'not found';
    case 0:
      return 'active';
    case 1:
      return 'requireActivation';
    case 2:
      return 'pending';
    case 3:
      return 'suspended';
    case 4:
      return 'deactivated';
    default:
      throw new Error(`Unknown card state: ${stateId}`);
  }
}

// eslint-disable-next-line import/prefer-default-export
export {getCardState};
