import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Users } from "lucide-react";
import { formatCurrency } from "@/lib/calculations";

interface StaffMember {
  id: string;
  role: string;
  salary_base: number;
  social_tax_pct: number;
  people_count: number;
  apply_aguinaldo: number;
}

interface ManoObraFormProps {
  onSave: (data: any) => void;
  onCancel: () => void;
}

// Opciones disponibles de roles
const availableRoles = [
  "Ing. Agrónomo",
  "Encargado",
  "Peón rural",
  "Tractorista"
];

export default function ManoObraForm({ onSave, onCancel }: ManoObraFormProps) {
  const [staffList, setStaffList] = useState<StaffMember[]>([
    {
      id: "staff_1",
      role: "",
      salary_base: 0,
      social_tax_pct: 30,
      people_count: 1,
      apply_aguinaldo: 0,
    }
  ]);

  const [nextId, setNextId] = useState(2);

  const [globals, setGlobals] = useState({
    overtime_monthly_est: 0,
    personnel_expenses_yearly: 0,
  });

  // Funciones para manejar personal
  const addStaffMember = () => {
    const newMember: StaffMember = {
      id: `staff_${nextId}`,
      role: "",
      salary_base: 0,
      social_tax_pct: 30,
      people_count: 1,
      apply_aguinaldo: 0,
    };
    setStaffList(prev => [...prev, newMember]);
    setNextId(prev => prev + 1);
  };

  const removeStaffMember = (id: string) => {
    setStaffList(staffList.filter(member => member.id !== id));
  };

  const updateStaffMember = (id: string, updates: Partial<StaffMember>) => {
    setStaffList(staffList.map(member =>
      member.id === id ? { ...member, ...updates } : member
    ));
  };

  // Cálculos
  const calculateStaffMemberTotal = (member: StaffMember) => {
    const monthlyBase = member.salary_base * member.people_count;
    const socialTax = monthlyBase * (member.social_tax_pct / 100);
    const aguinaldo = member.apply_aguinaldo * member.people_count;
    const monthlyTotal = monthlyBase + socialTax;
    const annualTotal = (monthlyTotal * 12) + aguinaldo;

    return {
      monthly_base: monthlyBase,
      social_tax: socialTax,
      aguinaldo: aguinaldo,
      monthly_total: monthlyTotal,
      annual_total: annualTotal
    };
  };

  const calculateTotalLaborCost = () => {
    const staffTotals = staffList.map(member => calculateStaffMemberTotal(member));

    const totalMonthlyPayroll = staffTotals.reduce((sum, staff) => sum + staff.monthly_total, 0) + globals.overtime_monthly_est;
    const totalAnnualGross = (totalMonthlyPayroll * 12) + globals.personnel_expenses_yearly;

    return {
      total_monthly_payroll: totalMonthlyPayroll,
      total_annual_gross: totalAnnualGross,
      staff_breakdown: staffTotals
    };
  };

  // Calcular roles disponibles (excluyendo los ya seleccionados)
  const getAvailableRoles = () => {
    const selectedRoles = staffList.map(member => member.role).filter(role => role.trim() !== '');
    return availableRoles.filter(role => !selectedRoles.includes(role));
  };

  const handleSave = () => {
    if (staffList.length === 0) return;

    // Validate that all required fields are filled
    for (const member of staffList) {
      if (!member.role || member.role.trim() === '') {
        alert('Por favor selecciona un rol para todos los miembros del personal.');
        return;
      }
      if (!member.salary_base || member.salary_base <= 0) {
        alert('Por favor ingresa un sueldo base válido mayor a 0 para todos los miembros.');
        return;
      }
      if (!member.social_tax_pct || member.social_tax_pct <= 0) {
        alert('Por favor ingresa cargas sociales válidas mayor a 0.');
        return;
      }
      if (!member.people_count || member.people_count <= 0) {
        alert('Por favor ingresa una cantidad de personas válida mayor a 0.');
        return;
      }
    }

    const breakdown = calculateTotalLaborCost();

    const costData = {
      category: "mano-obra",
      details: {
        type: "Personal",
        data: {
          staff_list: staffList,
          globals: globals
        },
        breakdown: {
          total_monthly_payroll: breakdown.total_monthly_payroll,
          total_annual_gross: breakdown.total_annual_gross
        }
      },
      total_amount: breakdown.total_annual_gross
    };

    onSave(costData);
  };

  const totals = calculateTotalLaborCost();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <Users className="h-12 w-12 text-primary mx-auto mb-2" />
        <h3 className="text-lg font-semibold mb-2">Mano de Obra</h3>
        <p className="text-sm text-muted-foreground">
          Gestiona el personal y calcula costos anuales incluyendo aguinaldo y cargas sociales
        </p>
      </div>

      {/* Staff List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {staffList.map((member) => {
            const calculations = calculateStaffMemberTotal(member);
            return (
              <div key={member.id} className="p-4 border border-border rounded-lg space-y-3 bg-secondary/30">
                <div className="flex justify-between items-start">
                  <div className="flex-1 space-y-3">
                    {/* Role */}
                    <div>
                      <Label className="text-xs">Rol/Puesto</Label>
                      <Select
                        value={member.role}
                        onValueChange={(value) => updateStaffMember(member.id, { role: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar rol..." />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableRoles().map((role) => (
                            <SelectItem key={role} value={role}>
                              {role}
                            </SelectItem>
                          ))}
                          {/* Si ya tiene un rol seleccionado, mostrarlo aunque esté duplicado */}
                          {member.role && !getAvailableRoles().includes(member.role) && (
                            <SelectItem value={member.role}>
                              {member.role}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Salary and People Count */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs">Sueldo Base Mensual</Label>
                        <CurrencyInput
                          value={member.salary_base || ''}
                          onChange={(value) => updateStaffMember(member.id, { salary_base: value })}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Cantidad de Personas</Label>
                        <Input
                          type="number"
                          value={member.people_count || ''}
                          onChange={(e) => updateStaffMember(member.id, { people_count: parseInt(e.target.value) || 1 })}
                          placeholder="1"
                          min="1"
                        />
                      </div>
                    </div>

                    {/* Social Tax and Aguinaldo */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs">Cargas Sociales (%)</Label>
                        <Input
                          type="number"
                          value={member.social_tax_pct || ''}
                          onChange={(e) => updateStaffMember(member.id, { social_tax_pct: parseFloat(e.target.value) || 0 })}
                          placeholder="30"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Aguinaldo Anual por Persona</Label>
                        <CurrencyInput
                          value={member.apply_aguinaldo || ''}
                          onChange={(value) => updateStaffMember(member.id, { apply_aguinaldo: value })}
                          placeholder="0"
                        />
                      </div>
                    </div>

                    {/* Calculations Display */}
                    <div className="p-3 bg-primary/5 rounded border">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Mensual (base + cargas):</span>
                          <div className="font-semibold">{formatCurrency(calculations.monthly_total, true)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Anual total:</span>
                          <div className="font-semibold">{formatCurrency(calculations.annual_total, true)}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive ml-2"
                    onClick={() => removeStaffMember(member.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}

          <Button type="button" variant="outline" onClick={addStaffMember} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Agregar Personal
          </Button>
        </CardContent>
      </Card>

      {/* Global Costs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Costos Adicionales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Horas Extras Mensuales Estimadas</Label>
              <CurrencyInput
                value={globals.overtime_monthly_est || ''}
                onChange={(value) => setGlobals(prev => ({ ...prev, overtime_monthly_est: value }))}
                placeholder="0"
              />
            </div>
            <div>
              <Label>Gastos del Personal (Anuales)</Label>
              <CurrencyInput
                value={globals.personnel_expenses_yearly || ''}
                onChange={(value) => setGlobals(prev => ({ ...prev, personnel_expenses_yearly: value }))}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Indumentaria, herramientas, capacitación, etc.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total Summary */}
      <div className="p-4 bg-primary/10 rounded-lg">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Nómina mensual total:</span>
            <span className="font-semibold">{formatCurrency(totals.total_monthly_payroll, true)}</span>
          </div>
          <div className="flex justify-between">
            <span>Gastos anuales del personal:</span>
            <span className="font-semibold">{formatCurrency(globals.personnel_expenses_yearly, true)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 font-bold text-lg">
            <span>Costo Total Anual:</span>
            <span>{formatCurrency(totals.total_annual_gross, true)}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button onClick={handleSave} className="flex-1" disabled={staffList.length === 0}>
          Guardar
        </Button>
      </div>
    </div>
  );
}
