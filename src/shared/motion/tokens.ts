import { Easing } from 'react-native';

export const motionDurations = {
  instant: 80,
  press: 120,
  fast: 160,
  normal: 220,
  slow: 320,
  morph: 360,
};

export const motionEasings = {
  standard: Easing.bezier(0.2, 0, 0, 1),
  emphasized: Easing.bezier(0.18, 0.9, 0.22, 1),
  exit: Easing.bezier(0.4, 0, 1, 1),
};

export const motionScales = {
  press: 0.975,
  cardPress: 0.985,
  modalEnter: 0.96,
};

export const motionOpacity = {
  press: 0.9,
  cardPress: 0.92,
};
