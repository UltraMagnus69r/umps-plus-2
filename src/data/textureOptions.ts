/**
 * Single source of truth for inside-border texture options.
 * Order and labels must match Surface FX (Border Texture / Text Box Texture) dropdowns.
 * `file` is stored in cardData.selectedTexture / rulesTextBoxTexture and used in /assets/textures/{file}.
 */
export const TEXTURE_OPTIONS: { file: string; label: string }[] = [
  { file: '', label: 'None' },
  { file: 'Marble Texture.png', label: 'Marble' },
  { file: 'Forest Texture.png', label: 'Forest' },
  { file: 'Cracked Earth Texture.png', label: 'Cracked Earth' },
  { file: 'Flame Texture.png', label: 'Flame' },
  { file: 'Ghostly Texture.png', label: 'Ghostly' },
  { file: 'Swirl Texture.png', label: 'Swirl' },
  { file: 'Tsunami Texture.png', label: 'Tsunami' },
  { file: 'Animal Texture.png', label: 'Animal' },
  { file: 'Poison Texture.png', label: 'Poison' },
]
