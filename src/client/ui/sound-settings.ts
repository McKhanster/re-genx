/**
 * SoundSettings - UI for controlling sound effects and ambient volume
 */

import { soundManager } from '../audio/sound-manager';

export class SoundSettings {
  private container: HTMLElement | null = null;
  private visible: boolean = false;

  constructor() {
    this.createUI();
    this.attachEventListeners();
    this.loadSettings();
  }

  /**
   * Creates the HTML structure for sound settings
   */
  private createUI(): void {
    this.container = document.createElement('div');
    this.container.id = 'sound-settings';
    this.container.className = 'sound-settings';
    this.container.innerHTML = `
      <button class="sound-settings-toggle" id="sound-settings-toggle" title="Sound Settings">
        🔊
      </button>
      
      <div class="sound-settings-panel" id="sound-settings-panel">
        <div class="sound-settings-header">
          <h3>Sound Settings</h3>
          <button class="sound-settings-close" id="sound-settings-close">✕</button>
        </div>
        
        <div class="sound-settings-content">
          <div class="sound-setting-item">
            <label for="master-volume">Master Volume</label>
            <input 
              type="range" 
              id="master-volume" 
              min="0" 
              max="100" 
              value="70"
              class="sound-slider"
            />
            <span class="volume-value" id="master-volume-value">70%</span>
          </div>
          
          <div class="sound-setting-item">
            <label for="ambient-volume">Ambient Volume</label>
            <input 
              type="range" 
              id="ambient-volume" 
              min="0" 
              max="100" 
              value="30"
              class="sound-slider"
            />
            <span class="volume-value" id="ambient-volume-value">30%</span>
          </div>
          
          <div class="sound-setting-item">
            <label for="sound-enabled">
              <input 
                type="checkbox" 
                id="sound-enabled" 
                checked
              />
              Enable Sound Effects
            </label>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(this.container);
  }

  /**
   * Attaches event listeners
   */
  private attachEventListeners(): void {
    const toggleButton = document.getElementById('sound-settings-toggle');
    const closeButton = document.getElementById('sound-settings-close');
    const masterVolumeSlider = document.getElementById('master-volume') as HTMLInputElement;
    const ambientVolumeSlider = document.getElementById('ambient-volume') as HTMLInputElement;
    const soundEnabledCheckbox = document.getElementById('sound-enabled') as HTMLInputElement;

    if (toggleButton) {
      toggleButton.addEventListener('click', () => this.toggle());
    }

    if (closeButton) {
      closeButton.addEventListener('click', () => this.hide());
    }

    if (masterVolumeSlider) {
      masterVolumeSlider.addEventListener('input', (e) => {
        const value = parseInt((e.target as HTMLInputElement).value);
        this.setMasterVolume(value);
      });
    }

    if (ambientVolumeSlider) {
      ambientVolumeSlider.addEventListener('input', (e) => {
        const value = parseInt((e.target as HTMLInputElement).value);
        this.setAmbientVolume(value);
      });
    }

    if (soundEnabledCheckbox) {
      soundEnabledCheckbox.addEventListener('change', (e) => {
        const enabled = (e.target as HTMLInputElement).checked;
        this.setSoundEnabled(enabled);
      });
    }

    // Close panel when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.visible) return;
      
      const panel = document.getElementById('sound-settings-panel');
      const toggle = document.getElementById('sound-settings-toggle');
      
      if (panel && toggle && 
          !panel.contains(e.target as Node) && 
          !toggle.contains(e.target as Node)) {
        this.hide();
      }
    });
  }

  /**
   * Toggle settings panel visibility
   */
  public toggle(): void {
    if (this.visible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Show settings panel
   */
  public show(): void {
    const panel = document.getElementById('sound-settings-panel');
    if (panel) {
      panel.classList.add('visible');
      this.visible = true;
    }
  }

  /**
   * Hide settings panel
   */
  public hide(): void {
    const panel = document.getElementById('sound-settings-panel');
    if (panel) {
      panel.classList.remove('visible');
      this.visible = false;
    }
  }

  /**
   * Set master volume (0-100)
   */
  private setMasterVolume(value: number): void {
    const normalized = value / 100;
    soundManager.setVolume(normalized);
    
    const valueDisplay = document.getElementById('master-volume-value');
    if (valueDisplay) {
      valueDisplay.textContent = `${value}%`;
    }
    
    // Save to localStorage
    localStorage.setItem('soundMasterVolume', value.toString());
  }

  /**
   * Set ambient volume (0-100)
   */
  private setAmbientVolume(value: number): void {
    const normalized = value / 100;
    soundManager.setAmbientVolume(normalized);
    
    const valueDisplay = document.getElementById('ambient-volume-value');
    if (valueDisplay) {
      valueDisplay.textContent = `${value}%`;
    }
    
    // Save to localStorage
    localStorage.setItem('soundAmbientVolume', value.toString());
  }

  /**
   * Enable/disable sound effects
   */
  private setSoundEnabled(enabled: boolean): void {
    soundManager.setEnabled(enabled);
    
    // Update toggle button icon
    const toggleButton = document.getElementById('sound-settings-toggle');
    if (toggleButton) {
      toggleButton.textContent = enabled ? '🔊' : '🔇';
    }
    
    // Save to localStorage
    localStorage.setItem('soundEnabled', enabled.toString());
  }

  /**
   * Load settings from localStorage
   */
  private loadSettings(): void {
    // Load master volume
    const masterVolume = localStorage.getItem('soundMasterVolume');
    if (masterVolume) {
      const value = parseInt(masterVolume);
      const slider = document.getElementById('master-volume') as HTMLInputElement;
      if (slider) {
        slider.value = value.toString();
        this.setMasterVolume(value);
      }
    }

    // Load ambient volume
    const ambientVolume = localStorage.getItem('soundAmbientVolume');
    if (ambientVolume) {
      const value = parseInt(ambientVolume);
      const slider = document.getElementById('ambient-volume') as HTMLInputElement;
      if (slider) {
        slider.value = value.toString();
        this.setAmbientVolume(value);
      }
    }

    // Load sound enabled
    const soundEnabled = localStorage.getItem('soundEnabled');
    if (soundEnabled !== null) {
      const enabled = soundEnabled === 'true';
      const checkbox = document.getElementById('sound-enabled') as HTMLInputElement;
      if (checkbox) {
        checkbox.checked = enabled;
        this.setSoundEnabled(enabled);
      }
    }
  }
}
