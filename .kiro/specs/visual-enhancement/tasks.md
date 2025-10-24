# Implementation Plan

- [x] 1. Set up post-processing infrastructure

  - Study image in assets/orb.jpg
  - Create `PostProcessingManager` class in `src/client/rendering/post-processing-manager.ts`
  - Implement EffectComposer with RenderPass and UnrealBloomPass
  - Add mobile-specific optimizations (half resolution render targets, reduced bloom samples)
  - Integrate with SceneManager to replace direct rendering
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Implement Voronoi cell geometry generation

  - Study image in assets/orb.jpg
  - Create `CellGeometryGenerator` class in `src/client/rendering/cell-geometry-generator.ts`
  - Implement spherical Voronoi point distribution algorithm
  - Create cell polygon tessellation from Voronoi points
  - Generate Three.js BufferGeometry with cell depth variation
  - Add mobile optimization for reduced cell count (30-50 vs 80-100)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 3. Create plasma shader material with glow effects

  - Study image in assets/orb.jpg
  - Create shader files: `src/client/shaders/plasma-vertex.glsl` and `src/client/shaders/plasma-fragment.glsl`
  - Implement Fresnel effect for edge glow in fragment shader
  - Add Voronoi noise function for cell boundary detection
  - Implement multi-frequency plasma color animation
  - Create `PlasmaShaderMaterial` class in `src/client/rendering/plasma-shader-material.ts`
  - Add uniform management and time-based animation updates
  - _Requirements: 1.1, 1.2, 1.3, 2.4, 3.1, 3.2, 3.3, 3.4, 6.1, 6.2, 6.3, 6.4_

- [x] 4. Integrate cell geometry and plasma shader into CreatureRenderer

  - Study image in assets/orb.jpg
  - Replace `THREE.SphereGeometry` with `CellGeometryGenerator.generateCellGeometry()`
  - Replace `MeshPhongMaterial` with `PlasmaShaderMaterial`
  - Update `pulsate()` method to call `material.updateTime(deltaTime)`
  - Verify existing mutation attachment works with new geometry
  - Test care action animations with new material
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 5. Create atmospheric gradient background

  - Study image in assets/orb.jpg
  - Create shader files: `src/client/shaders/gradient-vertex.glsl` and `src/client/shaders/gradient-fragment.glsl`
  - Implement vertical gradient shader (dark blue to purple-red)
  - Create `BackgroundGradientRenderer` class in `src/client/effects/background-gradient-renderer.ts`
  - Create large inverted sphere mesh (radius 300 units)
  - Configure depth write disabled to render behind all objects
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 6. Implement foreground silhouette elements

  - Study image in assets/orb.jpg
  - Create `ForegroundRenderer` class in `src/client/effects/foreground-renderer.ts`
  - Generate abstract organic shapes for bottom of viewport
  - Apply dark base color with cyan-magenta edge highlights
  - Implement parallax effect (0.4x camera rotation)
  - Set opacity to 0.4 for creature visibility
  - Add enable/disable toggle for performance optimization
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 7. Create performance monitoring system

  - Study image in assets/orb.jpg
  - Create `PerformanceMonitor` class in `src/client/utils/performance-monitor.ts`
  - Implement frame time measurement (every 60 frames)
  - Calculate rolling average FPS over last 5 measurements
  - Implement effect priority system (foreground → plasma → bloom)
  - Add automatic effect disabling when FPS < 30
  - Add automatic effect re-enabling when FPS > 35 for 5 seconds
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 8. Integrate all renderers into SceneManager

  - Study image in assets/orb.jpg
  - Add `PostProcessingManager` initialization in SceneManager constructor
  - Add `BackgroundGradientRenderer` initialization
  - Add `ForegroundRenderer` initialization
  - Add `PerformanceMonitor` initialization
  - Create `update(deltaTime)` method to update all renderers
  - Replace `render()` method to use `postProcessing.render()`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 4.1, 4.2, 4.3, 4.4, 4.5, 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 9. Integrate performance-based quality adjustments

  - Study image in assets/orb.jpg
  - Connect PerformanceMonitor to PostProcessingManager for bloom intensity adjustment
  - Connect PerformanceMonitor to ForegroundRenderer for enable/disable
  - Connect PerformanceMonitor to PlasmaShaderMaterial for animation speed adjustment
  - Update SceneManager.update() to apply performance settings each frame
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 10. Update main.ts animation loop

  - Study image in assets/orb.jpg
  - Add deltaTime calculation using performance.now()
  - Call `sceneManager.update(deltaTime)` before render
  - Call `creatureRenderer.pulsate(deltaTime)` with deltaTime
  - Ensure all time-based animations use deltaTime for frame-rate independence
  - _Requirements: 3.2, 3.3, 3.4, 3.5_

- [ ] 11. Add error handling and fallbacks

  - Study image in assets/orb.jpg
  - Add shader compilation error detection in PlasmaShaderMaterial
  - Implement fallback to MeshPhongMaterial if shader fails
  - Add post-processing initialization error handling
  - Implement fallback to direct rendering if EffectComposer fails
  - Add WebGL context loss/restore handlers
  - Log errors to console for debugging
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 12. Optimize for mobile devices

  - Study image in assets/orb.jpg
  - Verify cell count reduction on mobile (30-50 cells)
  - Verify bloom resolution reduction on mobile (half resolution)
  - Verify foreground disabled by default on mobile
  - Test performance on mobile device or emulator
  - Adjust quality thresholds if needed to maintain 30fps
  - _Requirements: 1.5, 2.5, 3.5, 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 13. Visual quality verification and tuning

  - Study image in assets/orb.jpg
  - Compare creature appearance to reference image
  - Adjust bloom intensity for optimal glow (1.5-2.5 range)
  - Tune plasma color palette (cyan, magenta, purple, teal)
  - Adjust cell edge glow intensity (0.5-1.0 range)
  - Tune Fresnel power for edge highlight strength
  - Fine-tune gradient colors for atmosphere
  - _Requirements: 1.1, 1.2, 1.3, 2.4, 3.1, 3.3, 3.4, 4.1, 4.2_

- [ ]\* 14. Performance testing and optimization

  - Study image in assets/orb.jpg
  - Measure baseline FPS on desktop with all effects enabled
  - Measure baseline FPS on mobile with mobile optimizations
  - Test performance with 0, 5, and 10 mutations applied
  - Test performance during mutation animations
  - Test performance during care action animations
  - Verify adaptive quality system responds correctly to load
  - Profile with Chrome DevTools to identify bottlenecks
  - Optimize any performance issues found
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ]\* 15. Cross-browser and cross-device testing

  - Study image in assets/orb.jpg
  - Test on Chrome desktop (Windows/macOS)
  - Test on Firefox desktop
  - Test on Safari desktop (macOS)
  - Test on iOS Safari (iPhone/iPad)
  - Test on Chrome Android
  - Verify visual consistency across browsers
  - Verify performance meets targets on each platform
  - Fix any browser-specific issues
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ]\* 16. Mutation compatibility verification
  - Study image in assets/orb.jpg
  - Test each mutation type with new cell geometry
  - Verify mutations attach correctly to cell surface
  - Test multiple simultaneous mutations
  - Test mutation removal
  - Verify mutation animations work with plasma shader
  - Test stat feedback display with new visuals
  - Fix any compatibility issues
  - _Requirements: 2.5, 3.5, 5.5_
