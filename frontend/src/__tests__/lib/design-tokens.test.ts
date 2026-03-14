import {
  primitive,
  semantic,
  component,
  radius,
  spacing,
  colors,
  glass,
  focus,
  glassEffect,
  focusRing,
  componentClasses,
  transition,
  shadow,
  typography,
  roleAccents,
  padding,
} from '@/lib/design-tokens';

describe('Design Tokens', () => {
  describe('Constants', () => {
    it('should have primitive tokens', () => {
      expect(primitive).toBeDefined();
      expect(primitive.colors).toBeDefined();
      expect(primitive.spacing).toBeDefined();
      expect(primitive.radius).toBeDefined();
      expect(primitive.fontSize).toBeDefined();
      expect(primitive.fontWeight).toBeDefined();
      expect(primitive.boxShadow).toBeDefined();
      expect(primitive.transition).toBeDefined();
    });

    it('should have semantic tokens', () => {
      expect(semantic).toBeDefined();
      expect(semantic.bg).toBeDefined();
      expect(semantic.text).toBeDefined();
      expect(semantic.border).toBeDefined();
      expect(semantic.accent).toBeDefined();
      expect(semantic.glass).toBeDefined();
      expect(semantic.focus).toBeDefined();
    });

    it('should have component tokens', () => {
      expect(component).toBeDefined();
      expect(component.button).toBeDefined();
      expect(component.card).toBeDefined();
      expect(component.kpi).toBeDefined();
      expect(component.input).toBeDefined();
      expect(component.badge).toBeDefined();
      expect(component.nav).toBeDefined();
      expect(component.section).toBeDefined();
      expect(component.module).toBeDefined();
    });

    it('should have legacy compatibility tokens', () => {
      expect(radius).toBeDefined();
      expect(spacing).toBeDefined();
      expect(colors).toBeDefined();
      expect(glass).toBeDefined();
      expect(focus).toBeDefined();
    });

    it('should have additional exports', () => {
      expect(transition).toBeDefined();
      expect(shadow).toBeDefined();
      expect(typography).toBeDefined();
      expect(roleAccents).toBeDefined();
      expect(padding).toBeDefined();
    });
  });

  describe('Functions', () => {
    it('glassEffect should return correct glass class', () => {
      expect(glassEffect('subtle')).toBe(glass.subtle);
      expect(glassEffect('default')).toBe(glass.default);
      expect(glassEffect('strong')).toBe(glass.strong);
      expect(glassEffect('panel')).toBe(glass.panel);
      // default parameter
      expect(glassEffect()).toBe(glass.default);
    });

    it('focusRing should return focus ring class', () => {
      expect(focusRing()).toBe(focus.ring);
    });

    it('componentClasses should return component variant class', () => {
      // Test with button primary
      const buttonPrimary = componentClasses('button', 'primary');
      expect(buttonPrimary).toBe(component.button.primary);
      
      // Test with button secondary
      const buttonSecondary = componentClasses('button', 'secondary');
      expect(buttonSecondary).toBe(component.button.secondary);
      
      // Test with card (no variant provided)
      const card = componentClasses('card');
      expect(card).toBe(''); // no variant provided
      
      // Test with non-existent variant
      const nonExistentVariant = componentClasses('button', 'nonExistent' as any);
      expect(nonExistentVariant).toBe('');
    });
  });
  
  describe('Primitive Token Values', () => {
    it('should have correct radius values', () => {
      expect(primitive.radius.none).toBe('0');
      expect(primitive.radius.sm).toBe('0.5rem');
      expect(primitive.radius.md).toBe('0.75rem');
      expect(primitive.radius.lg).toBe('1rem');
      expect(primitive.radius.xl).toBe('1.25rem');
      expect(primitive.radius.full).toBe('9999px');
    });
    
    it('should have correct spacing values', () => {
      expect(primitive.spacing['0']).toBe('0');
      expect(primitive.spacing['1']).toBe('0.25rem');
      expect(primitive.spacing['4']).toBe('1rem');
      expect(primitive.spacing['8']).toBe('2rem');
    });
  });
  
  describe('Legacy Radius', () => {
    it('should have correct legacy radius values', () => {
      expect(radius.sm).toBe('rounded-lg');
      expect(radius.md).toBe('rounded-xl');
      expect(radius.lg).toBe('rounded-2xl');
      expect(radius.xl).toBe('rounded-[28px]');
      expect(radius.full).toBe('rounded-full');
    });
  });
  
  describe('Glass Presets', () => {
    it('should have all glass presets', () => {
      expect(glass.subtle).toContain('backdrop-blur-md');
      expect(glass.default).toContain('backdrop-blur-lg');
      expect(glass.strong).toContain('backdrop-blur-xl');
      expect(glass.panel).toContain('backdrop-blur-lg');
    });
  });
  
  describe('Typography', () => {
    it('should have typography presets', () => {
      expect(typography.h1).toContain('text-4xl');
      expect(typography.h2).toContain('text-3xl');
      expect(typography.body).toContain('text-base');
      expect(typography.mono).toContain('font-mono');
    });
  });
  
  describe('Role Accents', () => {
    it('should have role accent tokens', () => {
      expect(roleAccents.owner.primary).toContain('emerald');
      expect(roleAccents.staff.primary).toContain('blue');
      expect(roleAccents.client.primary).toContain('amber');
    });
  });
});
