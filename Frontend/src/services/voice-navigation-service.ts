interface VoiceNavigationOptions {
  enabled: boolean;
  voice?: SpeechSynthesisVoice;
  rate: number;
  pitch: number;
  volume: number;
}

interface NavigationInstruction {
  id: string;
  text: string;
  distance: number;
  position: [number, number];
  type: 'turn' | 'continue' | 'arrive' | 'warning' | 'start';
  maneuver?: string;
}

class VoiceNavigationService {
  private synth: SpeechSynthesis;
  private options: VoiceNavigationOptions = {
    enabled: true,
    rate: 1.0,
    pitch: 1.0,
    volume: 0.8
  };
  private currentInstructions: NavigationInstruction[] = [];
  private announcedInstructions: Set<string> = new Set();

  constructor() {
    this.synth = window.speechSynthesis;
  }

  // Initialize voice navigation
  async initialize(): Promise<void> {
    // Wait for voices to load
    return new Promise((resolve) => {
      if (this.synth.getVoices().length > 0) {
        this.selectDefaultVoice();
        resolve();
      } else {
        this.synth.addEventListener('voiceschanged', () => {
          this.selectDefaultVoice();
          resolve();
        }, { once: true });
      }
    });
  }

  // Select default voice (prefer English)
  private selectDefaultVoice(): void {
    const voices = this.synth.getVoices();
    const englishVoice = voices.find(voice => 
      voice.lang.includes('en') && voice.default
    ) || voices.find(voice => voice.lang.includes('en'));
    
    if (englishVoice) {
      this.options.voice = englishVoice;
    }
  }

  // Set navigation instructions
  setInstructions(instructions: NavigationInstruction[]): void {
    this.currentInstructions = instructions;
    this.announcedInstructions.clear();
  }

  // Check and announce instructions based on current position
  checkAndAnnounce(currentPosition: [number, number], heading?: number): void {
    if (!this.options.enabled || this.currentInstructions.length === 0) return;

    const currentDistance = this.calculateDistance(
      currentPosition,
      this.currentInstructions[0]?.position || [0, 0]
    );

    // Announce upcoming instructions
    for (const instruction of this.currentInstructions) {
      const distance = this.calculateDistance(currentPosition, instruction.position);
      
      // Announce if within threshold and not already announced
      if (this.shouldAnnounce(instruction, distance) && 
          !this.announcedInstructions.has(instruction.id)) {
        this.announce(instruction, distance);
        this.announcedInstructions.add(instruction.id);
      }
    }
  }

  // Determine if instruction should be announced
  private shouldAnnounce(instruction: NavigationInstruction, distance: number): boolean {
    switch (instruction.type) {
      case 'turn':
        return distance <= 200; // Announce turns 200m ahead
      case 'continue':
        return distance <= 500; // Announce continue instructions 500m ahead
      case 'warning':
        return distance <= 300; // Announce warnings 300m ahead
      case 'arrive':
        return distance <= 100; // Announce arrival 100m ahead
      default:
        return false;
    }
  }

  // Announce instruction
  private announce(instruction: NavigationInstruction, distance: number): void {
    let text = instruction.text;
    
    // Add distance context for turn instructions
    if (instruction.type === 'turn' && distance > 50) {
      const distanceText = distance > 100 
        ? `In ${Math.round(distance / 100) * 100} meters, `
        : `In ${Math.round(distance)} meters, `;
      text = distanceText + text.toLowerCase();
    }

    this.speak(text);
  }

  // Speak text using browser's speech synthesis
  speak(text: string): void {
    if (!this.options.enabled) return;

    // Cancel any ongoing speech
    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = this.options.voice || null;
    utterance.rate = this.options.rate;
    utterance.pitch = this.options.pitch;
    utterance.volume = this.options.volume;

    console.log('🔊 Voice Navigation:', text);
    this.synth.speak(utterance);
  }

  // Generate turn-by-turn instructions from route
  generateInstructions(route: [number, number][], destination: string): NavigationInstruction[] {
    if (route.length < 2) return [];

    const instructions: NavigationInstruction[] = [];
    
    // Starting instruction
    instructions.push({
      id: 'start',
      text: 'Navigation started. Proceed to the highlighted route.',
      distance: 0,
      position: route[0],
      type: 'continue'
    });

    // Add waypoint instructions (simplified)
    const waypointInterval = Math.max(1, Math.floor(route.length / 4));
    for (let i = waypointInterval; i < route.length - 1; i += waypointInterval) {
      const bearing = this.calculateBearing(route[i - 1], route[i]);
      const direction = this.getDirectionFromBearing(bearing);
      
      instructions.push({
        id: `waypoint-${i}`,
        text: `Continue ${direction}`,
        distance: 0,
        position: route[i],
        type: 'continue'
      });
    }

    // Add arrival instruction
    const lastPoint = route[route.length - 1];
    instructions.push({
      id: 'arrive',
      text: `Arriving at ${destination}`,
      distance: 0,
      position: lastPoint,
      type: 'arrive'
    });

    return instructions;
  }

  // Calculate bearing between two points
  private calculateBearing(from: [number, number], to: [number, number]): number {
    const lat1 = from[1] * Math.PI / 180;
    const lat2 = to[1] * Math.PI / 180;
    const deltaLng = (to[0] - from[0]) * Math.PI / 180;

    const y = Math.sin(deltaLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - 
              Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);

    const bearing = Math.atan2(y, x) * 180 / Math.PI;
    return (bearing + 360) % 360;
  }

  // Convert bearing to direction text
  private getDirectionFromBearing(bearing: number): string {
    const directions = [
      'north', 'northeast', 'east', 'southeast',
      'south', 'southwest', 'west', 'northwest'
    ];
    const index = Math.round(bearing / 45) % 8;
    return directions[index];
  }

  // Calculate distance between coordinates
  private calculateDistance(coord1: [number, number], coord2: [number, number]): number {
    const R = 6371000; // Earth's radius in meters
    const lat1Rad = coord1[1] * Math.PI / 180;
    const lat2Rad = coord2[1] * Math.PI / 180;
    const deltaLatRad = (coord2[1] - coord1[1]) * Math.PI / 180;
    const deltaLngRad = (coord2[0] - coord1[0]) * Math.PI / 180;

    const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  // Update voice settings
  updateSettings(options: Partial<VoiceNavigationOptions>): void {
    this.options = { ...this.options, ...options };
  }

  // Get available voices
  getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.synth.getVoices();
  }

  // Enable/disable voice navigation
  setEnabled(enabled: boolean): void {
    this.options.enabled = enabled;
    if (!enabled) {
      this.synth.cancel();
    }
  }

  // Stop all speech
  stop(): void {
    this.synth.cancel();
  }
}

export default new VoiceNavigationService();
export type { VoiceNavigationOptions, NavigationInstruction }; 