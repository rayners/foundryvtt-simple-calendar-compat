# Module Management Dialog Fix

## Problem
Foundry VTT v13+ Module Management dialog was throwing the error:
```
TypeError: Cannot read properties of undefined (reading 'length')
    at foundry.mjs:111188
```

## Root Cause
The ModuleManagement dialog in Foundry VTT expects module objects to have specific array properties that our fake Simple Calendar module was missing:

```javascript
// From foundry.mjs:111188-111194
mod.hasPacks = mod.packs.length > 0;       // Line 111188 - THE ERROR
mod.hasScripts = mod.scripts.length > 0;   // Line 111189  
mod.hasStyles = mod.styles.length > 0;     // Line 111190
mod.authors = mod.authors.map(author => {  // Line 111194
```

## Solution
Added the required array properties to our fake module object:

```typescript
const fakeModule = {
  id: 'foundryvtt-simple-calendar',
  title: 'Simple Calendar (Compatibility Bridge)',
  active: true,
  version: '2.4.18',
  compatibility: {
    minimum: '13',
    verified: '13'
  },
  // Required array properties for ModuleManagement dialog (foundry.mjs:111188-111194)
  packs: [],
  scripts: [],
  styles: [],
  authors: [{ name: 'Simple Calendar Compatibility Bridge' }],
  relationships: { systems: [] },
  // Updated toObject method to include all properties
  toObject: function() {
    return {
      id: this.id,
      title: this.title,
      active: this.active,
      version: this.version,
      compatibility: this.compatibility,
      packs: this.packs,
      scripts: this.scripts,
      styles: this.styles,
      authors: this.authors,
      relationships: this.relationships
    };
  }
};
```

## Files Changed
- `/src/main.ts` - Added required array properties to fake module object

## Result
The Module Management dialog can now safely access `.length` properties on all expected arrays without throwing errors.