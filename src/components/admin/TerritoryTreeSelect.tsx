import { useState, useMemo } from 'react';
import type { GeographicTerritory } from '@/types/zone';
import { TerritoryAvailabilityState } from '@/types/zone';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronDown, Lock, AlertTriangle, CheckCircle, Search, X } from 'lucide-react';

interface TerritoryTreeSelectProps {
  tree: GeographicTerritory[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  disabled?: boolean;
}

const normalizeText = (str: string) =>
  str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export const TerritoryTreeSelect = ({
  tree,
  selectedIds,
  onChange,
  disabled = false,
}: TerritoryTreeSelectProps) => {
  const [expandedIds, setExpandedIds] = useState<Record<number, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Filtrado de árbol según búsqueda con expansión automática de nodos padres
  const { displayTree, parentIdsToExpand } = useMemo(() => {
    const query = normalizeText(searchQuery.trim());
    if (!query) {
      return { displayTree: tree, parentIdsToExpand: new Set<number>() };
    }

    const parentIds = new Set<number>();

    const filterNodes = (nodes: GeographicTerritory[]): GeographicTerritory[] => {
      const result: GeographicTerritory[] = [];

      for (const node of nodes) {
        const matchesSelf = normalizeText(node.name).includes(query);
        const filteredChildren =
          node.children && node.children.length > 0
            ? filterNodes(node.children)
            : [];

        if (matchesSelf || filteredChildren.length > 0) {
          if (filteredChildren.length > 0) {
            parentIds.add(node.id);
          }
          result.push({
            ...node,
            children: matchesSelf ? node.children : filteredChildren,
          });
        }
      }

      return result;
    };

    const filtered = filterNodes(tree);
    return { displayTree: filtered, parentIdsToExpand: parentIds };
  }, [tree, searchQuery]);

  // Mapa de ID -> { node, parentId }
  const nodeMap = useMemo(() => {
    const map = new Map<number, { node: GeographicTerritory; parentId: number | null }>();

    const traverse = (nodes: GeographicTerritory[], parentId: number | null = null) => {
      nodes.forEach((node) => {
        map.set(node.id, { node, parentId });
        if (node.children && node.children.length > 0) {
          traverse(node.children, node.id);
        }
      });
    };

    traverse(tree);
    return map;
  }, [tree]);

  const selectedMap = useMemo(() => {
    const map: Record<number, boolean> = {};
    selectedIds.forEach((id) => {
      map[Number(id)] = true;
    });
    return map;
  }, [selectedIds]);

  // Determina si un nodo está seleccionado explícitamente o implícitamente por un ancestro seleccionado
  const isNodeSelected = (node: GeographicTerritory): boolean => {
    const nodeId = Number(node.id);
    if (selectedMap[nodeId]) return true;

    let currentParentId = nodeMap.get(nodeId)?.parentId;
    while (currentParentId) {
      if (selectedMap[currentParentId]) return true;
      currentParentId = nodeMap.get(currentParentId)?.parentId;
    }

    return false;
  };

  // Calcula los nodos de cápsula de nivel superior representantes de la selección
  const selectedCapsules = useMemo(() => {
    if (selectedIds.length === 0 || !tree || tree.length === 0) return [];

    // Determina si un nodo o todas sus subdivisiones disponibles están totalmente seleccionadas
    const isFullySelected = (node: GeographicTerritory): boolean => {
      const isBlocked =
        node.availability_state === TerritoryAvailabilityState.BLOCKED ||
        node.availability_state === TerritoryAvailabilityState.FULLY_ASSIGNED;

      if (isBlocked) return false;

      if (isNodeSelected(node)) return true;

      if (node.children && node.children.length > 0) {
        const availableChildren = node.children.filter(
          (c) =>
            c.availability_state !== TerritoryAvailabilityState.BLOCKED &&
            c.availability_state !== TerritoryAvailabilityState.FULLY_ASSIGNED
        );
        return (
          availableChildren.length > 0 &&
          availableChildren.every((child) => isFullySelected(child))
        );
      }

      return false;
    };

    // Recorre de arriba a abajo buscando los representantes de mayor jerarquía
    const findTopCapsules = (nodes: GeographicTerritory[]): GeographicTerritory[] => {
      const result: GeographicTerritory[] = [];

      for (const node of nodes) {
        if (isFullySelected(node)) {
          result.push(node);
        } else if (node.children && node.children.length > 0) {
          result.push(...findTopCapsules(node.children));
        }
      }

      return result;
    };

    return findTopCapsules(tree);
  }, [selectedIds, tree, nodeMap, selectedMap]);

  // Obtiene todos los IDs de descendientes no bloqueados de un nodo
  const getAvailableDescendantIds = (node: GeographicTerritory): number[] => {
    const isBlocked =
      node.availability_state === TerritoryAvailabilityState.BLOCKED ||
      node.availability_state === TerritoryAvailabilityState.FULLY_ASSIGNED;

    if (isBlocked) return [];

    let result: number[] = [Number(node.id)];
    if (node.children && node.children.length > 0) {
      node.children.forEach((child) => {
        result = result.concat(getAvailableDescendantIds(child));
      });
    }
    return result;
  };

  // Obtiene todos los IDs de descendientes (bloqueados o no)
  const getAllDescendantIds = (node: GeographicTerritory): number[] => {
    let result: number[] = [Number(node.id)];
    if (node.children && node.children.length > 0) {
      node.children.forEach((child) => {
        result = result.concat(getAllDescendantIds(child));
      });
    }
    return result;
  };

  // Obtiene la lista de IDs de todos los ancestros de un nodo
  const getAncestorIds = (nodeId: number): number[] => {
    const ancestors: number[] = [];
    let currentId = nodeMap.get(Number(nodeId))?.parentId;
    while (currentId) {
      ancestors.push(currentId);
      currentId = nodeMap.get(currentId)?.parentId;
    }
    return ancestors;
  };

  const handleToggleNode = (node: GeographicTerritory, isCurrentlyChecked: boolean) => {
    if (disabled) return;

    // Resolver el conjunto completo de IDs seleccionados (incluyendo implícitos)
    const fullSelectedSet = new Set<number>();
    nodeMap.forEach(({ node: n }) => {
      if (isNodeSelected(n)) {
        fullSelectedSet.add(Number(n.id));
      }
    });

    let newSelected = Array.from(fullSelectedSet);

    if (isCurrentlyChecked) {
      // AL DESMARCAR UN NODO:
      // Remover el nodo, todos sus descendientes y todos sus ancestros
      const toRemove = new Set([
        ...getAllDescendantIds(node).map(Number),
        ...getAncestorIds(Number(node.id)).map(Number),
      ]);
      newSelected = newSelected.filter((id) => !toRemove.has(id));
    } else {
      // AL MARCAR UN NODO:
      // Agregar el nodo y todos sus descendientes disponibles
      const toAdd = getAvailableDescendantIds(node).map(Number);
      toAdd.forEach((id) => {
        if (!newSelected.includes(id)) {
          newSelected.push(id);
        }
      });

      // Auto-promover padres si todos sus hijos disponibles están seleccionados
      let changed = true;
      while (changed) {
        changed = false;
        nodeMap.forEach(({ node: parentCandidateNode }, parentId) => {
          if (newSelected.includes(parentId)) return;

          const parentBlocked =
            parentCandidateNode.availability_state === TerritoryAvailabilityState.BLOCKED ||
            parentCandidateNode.availability_state === TerritoryAvailabilityState.FULLY_ASSIGNED;
          if (parentBlocked) return;

          const availableChildren =
            parentCandidateNode.children?.filter(
              (c) =>
                c.availability_state !== TerritoryAvailabilityState.BLOCKED &&
                c.availability_state !== TerritoryAvailabilityState.FULLY_ASSIGNED
            ) || [];

          if (
            availableChildren.length > 0 &&
            availableChildren.every((c) => newSelected.includes(Number(c.id)))
          ) {
            newSelected.push(parentId);
            changed = true;
          }
        });
      }
    }

    onChange(newSelected);
  };

  const renderBadge = (state?: TerritoryAvailabilityState, assignedZoneName?: string | null) => {
    switch (state) {
      case TerritoryAvailabilityState.BLOCKED:
        return (
          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 text-xs flex items-center gap-1">
            <Lock className="h-3 w-3" />
            Asignado a {assignedZoneName || 'otra zona'}
          </Badge>
        );
      case TerritoryAvailabilityState.FULLY_ASSIGNED:
        return (
          <Badge variant="outline" className="bg-muted text-muted-foreground text-xs flex items-center gap-1">
            Totalmente asignado
          </Badge>
        );
      case TerritoryAvailabilityState.PARTIALLY_ASSIGNED:
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-xs flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Parcialmente asignado
          </Badge>
        );
      case TerritoryAvailabilityState.AVAILABLE:
      default:
        return (
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Disponible
          </Badge>
        );
    }
  };

  const renderNode = (node: GeographicTerritory, level = 0) => {
    const isExpanded = !!expandedIds[node.id] || (searchQuery.trim().length > 0 && parentIdsToExpand.has(node.id));
    const hasChildren = node.children && node.children.length > 0;
    const isChecked = isNodeSelected(node);
    const isBlocked = node.availability_state === TerritoryAvailabilityState.BLOCKED || node.availability_state === TerritoryAvailabilityState.FULLY_ASSIGNED;

    return (
      <div key={node.id} className="select-none">
        <div
          className={`flex items-center gap-2 p-2 rounded-md hover:bg-accent/40 transition-colors ${
            isChecked ? 'bg-primary/5 font-medium' : ''
          }`}
          style={{ paddingLeft: `${level * 18 + 8}px` }}
        >
          {hasChildren ? (
            <button
              type="button"
              onClick={() => toggleExpand(node.id)}
              className="p-1 hover:bg-muted rounded text-muted-foreground"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          ) : (
            <span className="w-6" />
          )}

          <Checkbox
            id={`node-${node.id}`}
            checked={isChecked}
            disabled={disabled || isBlocked}
            onCheckedChange={() => handleToggleNode(node, isChecked)}
          />

          <label
            htmlFor={`node-${node.id}`}
            className={`text-sm cursor-pointer flex-1 flex items-center justify-between gap-2 ${
              isBlocked ? 'opacity-60 cursor-not-allowed' : ''
            }`}
          >
            <span className="text-foreground">{node.name}</span>
            {renderBadge(node.availability_state, node.assigned_zone_name)}
          </label>
        </div>

        {hasChildren && isExpanded && (
          <div className="border-l border-border/50 ml-4">
            {node.children!.map((child) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (!tree || tree.length === 0) {
    return (
      <div className="text-center p-6 border border-dashed rounded-lg text-sm text-muted-foreground">
        No se encontraron territorios cargados para este país.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Caja de Cápsulas de Territorios Seleccionados */}
      <div className="border border-border/80 rounded-lg p-3 bg-muted/20 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Resumen de Territorios Seleccionados
            </span>
            <Badge variant="secondary" className="text-xs font-normal">
              {selectedCapsules.length} {selectedCapsules.length === 1 ? 'territorio' : 'territorios'}
            </Badge>
          </div>
          {selectedIds.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange([])}
              className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
              title="Quitar todos los territorios seleccionados"
            >
              Desmarcar todo
            </Button>
          )}
        </div>

        {selectedCapsules.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-1">
            Ningún territorio seleccionado todavía. Selecciona provincias, departamentos o localidades en el árbol inferior.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {selectedCapsules.map((node) => (
              <Badge
                key={node.id}
                variant="outline"
                className="pl-2.5 pr-1 py-1 text-xs font-medium flex items-center gap-1.5 bg-primary/10 text-primary border-primary/30 hover:bg-primary/20 transition-colors"
              >
                <span>{node.name}</span>
                <button
                  type="button"
                  onClick={() => handleToggleNode(node, true)}
                  className="p-0.5 hover:bg-primary/30 rounded-full text-primary hover:text-destructive transition-colors"
                  title={`Quitar ${node.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Buscador de Territorios */}
      <div className="relative flex items-center">
        <Search className="absolute left-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          placeholder="Buscar provincia, departamento o localidad..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-8 text-sm h-9 bg-background border-border/80"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 p-0.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
            title="Limpiar búsqueda"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Árbol de Selección */}
      <div className="border rounded-lg p-2 max-h-80 overflow-y-auto space-y-1 bg-background">
        {displayTree.length === 0 ? (
          <div className="text-center p-6 text-sm text-muted-foreground">
            No se encontraron territorios que coincidan con "{searchQuery}".
          </div>
        ) : (
          displayTree.map((node) => renderNode(node))
        )}
      </div>
    </div>
  );
};
