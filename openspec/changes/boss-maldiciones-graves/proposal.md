# Cambio: Maldiciones graves

Parte transversal de [boss-roster](../boss-roster/proposal.md). Las maldiciones graves no caducan solas: hay que curarlas. Las leves ya están hechas.

## Alcance

| Maldición | Efecto | Cura |
|---|---|---|
| Petrificación | Las rachas no suben y no hay congelaciones | Hasta curarla |
| Amnesia | Se ocultan las estadísticas históricas, incluso con Espejo de plata | Hasta curarla |
| Cadenas | Una tarea no se puede aplazar y su fallo duele el doble | Hasta curarla |

### Curas
- **Agua bendita:** ya existe y cura una maldición. Hay que comprobar que cura también las graves.
- **Penitencia:** 3 días consecutivos con todas las obligaciones debidas cumplidas; un día fallido reinicia el contador. Al completar el tercer día, la maldición se elimina automáticamente.
- **Revancha:** vencer al mismo boss quita la maldición al instante. Se implementa en el change del boss que la aplica.

### Límite
- Máximo 2 maldiciones a la vez. La misma no se acumula; se renueva su duración (las graves no tienen duración).

Las maldiciones graves se representan como permanentes (`expiresOn: 9999-12-31`) para reutilizar el motor de caducidad existente sin inventar una segunda colección de estados. El progreso de Penitencia se guarda en el perfil y se reinicia al renacer.

## Fuera de alcance
- **Hoz de Death** (vida máxima −10 %) y **Marca de Drácula** (daño por fallo ×1,5): van en los changes de Death y Drácula, porque su cura es la revancha de cada boss.
