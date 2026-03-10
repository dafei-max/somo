import React from 'react';
import FireflyOverlay from './overlays/FireflyOverlay';
import AuroraOverlay from './overlays/AuroraOverlay';
import MeteorShowerOverlay from './overlays/MeteorShowerOverlay';
import GalaxyOverlay from './overlays/GalaxyOverlay';
import FireworksOverlay from './overlays/FireworksOverlay';
import ValentineOverlay from './overlays/ValentineOverlay';

export default function AmbientOverlay({ effect, open, onComplete }) {
  switch (effect) {
    case 'firefly':
      return <FireflyOverlay open={open} onComplete={onComplete} />;
    case 'aurora':
      return <AuroraOverlay open={open} onComplete={onComplete} />;
    case 'meteor':
      return <MeteorShowerOverlay open={open} onComplete={onComplete} />;
    case 'galaxy':
      return <GalaxyOverlay open={open} onComplete={onComplete} />;
    case 'fireworks':
      return <FireworksOverlay open={open} onComplete={onComplete} />;
    case 'valentine':
      return <ValentineOverlay open={open} onComplete={onComplete} />;
    default:
      return null;
  }
}
