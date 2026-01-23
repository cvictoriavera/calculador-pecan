import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Settings, Save, Database, Trash2, Loader2, History } from "lucide-react"; 
import { getCurrentUser } from "@/services/userService";
import { apiRequest } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { useApp } from "@/contexts/AppContext";
import { updateProject } from "@/services/projectService";
import { createCampaign } from "@/services/campaignService";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";

const Config = () => {
  const [producerName, setProducerName] = useState("");
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [isMigrating, setIsMigrating] = useState(false);
  const { toast } = useToast();
  const { initialYear, setInitialYear, currentProjectId, projects, deleteProject, loadCampaigns, loadProjects } = useApp();
  const isTrialMode = () => localStorage.getItem('isTrialMode') === 'true';

  const [pais, setPais] = useState("Argentina");
  const [provincia, setProvincia] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [descripcion, setDescripcion] = useState(""); // Variable de estado en español
  
  // Estado para el selector de año
  const [añoInicio, setAñoInicio] = useState(initialYear || new Date().getFullYear());
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [isUpdatingProject, setIsUpdatingProject] = useState(false);
  const [isUpdatingHistory, setIsUpdatingHistory] = useState(false);

  const [geoData, setGeoData] = useState<{
    provinces: string[];
    departments: { [province: string]: string[] };
    municipalities: { [key: string]: string[] };
  }>({
    provinces: [],
    departments: {},
    municipalities: {},
  });

  const currentStartYear = initialYear || new Date().getFullYear();
  const campaignsToCreateCount = currentStartYear - añoInicio;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await getCurrentUser();
        setProducerName(user.name || "");
        setUserRoles(user.roles || []);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    console.log('Config: useEffect for projects triggered', { projectsLength: projects.length, currentProjectId });
    if (projects.length > 0 && currentProjectId) {
      const currentProject = projects.find(p => p.id === currentProjectId);
      if (currentProject) {
        console.log('Config: Setting project data from context', currentProject);
        setProjectName(currentProject.project_name);
        // Cargar descripción si existe
        if (currentProject.description) setDescripcion(currentProject.description);
      }
    }
  }, [projects, currentProjectId]);

  useEffect(() => {
    if (initialYear) {
      setAñoInicio(initialYear);
    }
  }, [initialYear]);

  useEffect(() => {
    const loadGeoData = async () => {
      try {
        const data = await import('../../public/geo-argentina.json');
        
        const provincesSet = new Set<string>();
        const departmentsMap: { [province: string]: Set<string> } = {};
        const municipalitiesMap: { [key: string]: Set<string> } = {};

        data.default.localidades_censales.forEach((loc: any) => {
          const province = loc.provincia.nombre;
          const department = loc.departamento.nombre;
          const municipality = loc.nombre;
          provincesSet.add(province);
          if (!departmentsMap[province]) departmentsMap[province] = new Set();
          departmentsMap[province].add(department);
          const key = `${province}-${department}`;
          if (!municipalitiesMap[key]) municipalitiesMap[key] = new Set();
          municipalitiesMap[key].add(municipality);
        });

        const provinces = Array.from(provincesSet).sort();
        const departments: { [province: string]: string[] } = {};
        const municipalities: { [key: string]: string[] } = {};

        Object.keys(departmentsMap).forEach(prov => departments[prov] = Array.from(departmentsMap[prov]).sort());
        Object.keys(municipalitiesMap).forEach(key => municipalities[key] = Array.from(municipalitiesMap[key]).sort());
        
        setGeoData({ provinces, departments, municipalities });
      } catch (error) {
        console.error("Error loading geo data:", error);
      }
    };

    if (pais === "Argentina") loadGeoData();
    else setGeoData({ provinces: [], departments: {}, municipalities: {} });
  }, [pais]);

  useEffect(() => {
    if (currentProjectId && projects.length > 0) {
      const currentProject = projects.find(p => p.id === currentProjectId);
      if (currentProject) {
        setPais(currentProject.pais || "Argentina");
        setProvincia(currentProject.provincia || "");
        setDepartamento(currentProject.departamento || "");
        setMunicipio(currentProject.municipio || "");
        setDescripcion(currentProject.description || "");
      }
    }
  }, [currentProjectId, projects]);

  // --- LÓGICA DE EXTENSIÓN DE HISTORIAL ---
  const handleUpdateInitialYear = async () => {
    if (!currentProjectId) return;
    if (añoInicio >= currentStartYear) return;

    setIsUpdatingHistory(true);

    try {
        const promises = [];
        for (let year = añoInicio; year < currentStartYear; year++) {
            const campaignData = {
                project_id: currentProjectId,
                campaign_name: `Campaña ${year}`,
                year: year,
                start_date: `Julio ${year}`,
                end_date: `Junio ${year + 1}`,
                status: 'closed',
                is_current: 0,
            };
            // @ts-ignore 
            promises.push(createCampaign(campaignData));
        }

        await Promise.all(promises);

        try {
            await updateProject(currentProjectId, { 
                // @ts-ignore 
                initial_year: añoInicio 
            });
        } catch (e) {
            console.warn("Backend update skipped for initial_year");
        }

        setInitialYear(añoInicio);
        await loadCampaigns();

        toast({
            title: "Historial extendido",
            description: `Se han generado ${campaignsToCreateCount} campañas nuevas exitosamente.`,
        });

    } catch (error) {
        console.error('Error extending campaigns:', error);
        toast({
            title: "Error",
            description: "Hubo un problema al crear las campañas antiguas.",
            variant: "destructive"
        });
        setAñoInicio(currentStartYear);
    } finally {
        setIsUpdatingHistory(false);
    }
  };

  const handleMigrateProduction = async () => {
      if (!confirm("¿Estás seguro de que quieres migrar los datos de producción? Esta acción no se puede deshacer.")) return;
      setIsMigrating(true);
      try {
        const result = await apiRequest('ccp/v1/database/migrate-production', { method: 'POST' });
        result.success ? toast({ title: "Migración exitosa", description: result.message }) : toast({ title: "Error en la migración", description: result.message, variant: "destructive" });
      } catch (error) { 
        console.error("Error migrating production data:", error);
        toast({
            title: "Error",
            description: "Ocurrió un error al ejecutar la migración.",
            variant: "destructive",
        });
      } finally { setIsMigrating(false); }
  };

  const handleDeleteProject = async () => {
     if (!currentProjectId) {
        toast({
            title: "Error",
            description: "No hay proyecto seleccionado.",
            variant: "destructive",
        });
        return;
     }
     setIsDeleting(true);
     try {
        await deleteProject(currentProjectId);
        toast({ title: "Proyecto eliminado", description: "El proyecto ha sido eliminado exitosamente." });
     } catch(error) { 
        console.error("Error deleting project:", error);
        toast({
            title: "Error",
            description: "No se pudo eliminar el proyecto.",
            variant: "destructive",
        });
     } finally { setIsDeleting(false); }
  };

  const handleSaveProjectData = async () => {
      if (!currentProjectId || !projectName.trim()) {
         toast({
             title: "Error",
             description: "El nombre del proyecto no puede estar vacío.",
             variant: "destructive",
         });
         return;
      }

      setIsUpdatingProject(true);
      console.log('Config: Updating project data', { currentProjectId, projectName, descripcion });
      try {
         // CORRECCIÓN AQUÍ: description (clave API) : descripcion (variable estado)
         await updateProject(currentProjectId, {
             project_name: projectName.trim(),
             description: descripcion.trim()
         });
         console.log('Config: Project updated successfully, reloading projects');
         await loadProjects();
         toast({ title: "Éxito", description: "Los datos del proyecto han sido actualizados." });
      } catch(error) {
         console.error("Error updating project data:", error);
         toast({
             title: "Error",
             description: "No se pudieron actualizar los datos del proyecto.",
             variant: "destructive",
         });
      } finally { setIsUpdatingProject(false); }
   };

  const handleSaveLocationData = async () => {
       if (!currentProjectId) {
         toast({
             title: "Error",
             description: "No hay proyecto seleccionado.",
             variant: "destructive",
         });
         return;
       }
       setIsUpdatingProject(true);
       console.log('Config: Updating location data', { currentProjectId, pais, provincia, departamento, municipio });
       try {
          await updateProject(currentProjectId, { pais, provincia, departamento, municipio });
          console.log('Config: Location updated successfully, reloading projects');
          await loadProjects();
          toast({ title: "Éxito", description: "Los datos de ubicación han sido actualizados." });
       } catch(error) {
         console.error("Error updating location data:", error);
         toast({
             title: "Error",
             description: "No se pudieron actualizar los datos de ubicación.",
             variant: "destructive",
         });
       } finally { setIsUpdatingProject(false); }
   };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl mb-2">Configuración</h1>
        <p className="text-muted-foreground">Ajustes generales de la aplicación</p>
      </div>

      {/* CARD 1: INFORMACIÓN DEL PROYECTO */}
      <Card className="border-border/50 shadow-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-accent" />
            <CardTitle className="text-foreground">Información del Proyecto</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre-productor">Nombre del Productor</Label>
            <Input id="nombre-productor" value={producerName} readOnly />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nombre-proyecto">Nombre del Proyecto</Label>
            <Input id="nombre-proyecto" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción del Proyecto</Label>
            <Textarea id="descripcion" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
          </div>
          <Button onClick={handleSaveProjectData} disabled={isUpdatingProject || !projectName.trim()} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 mt-4">
            <Save className="h-5 w-5" /> {isUpdatingProject ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </CardContent>
      </Card>

      {/* CARD 2: DATOS DE UBICACIÓN */}
      {!isTrialMode() && (
        <Card className="border-border/50 shadow-md">
           <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-accent" />
              <CardTitle className="text-foreground">Datos de Ubicación</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="space-y-2">
              <Label htmlFor="pais">País</Label>
              <Select value={pais} onValueChange={setPais}>
                <SelectTrigger><SelectValue placeholder="Selecciona un país" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Argentina">Argentina</SelectItem>
                  <SelectItem value="Brasil">Brasil</SelectItem>
                  <SelectItem value="Uruguay">Uruguay</SelectItem>
                </SelectContent>
              </Select>
            </div>
             {pais === "Argentina" ? (
                 <>
                   <div className="space-y-2">
                    <Label htmlFor="provincia">Provincia</Label>
                    <Select value={provincia} onValueChange={(v) => { setProvincia(v); setDepartamento(""); }}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{geoData.provinces.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                    </Select>
                   </div>
                   <div className="space-y-2">
                    <Label htmlFor="departamento">Departamento/Partido</Label>
                    <Select value={departamento} onValueChange={(v) => { setDepartamento(v); setMunicipio(""); }} disabled={!provincia}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{provincia && geoData.departments[provincia]?.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                    </Select>
                   </div>
                   <div className="space-y-2">
                    <Label htmlFor="municipio">Municipio</Label>
                    <Select value={municipio} onValueChange={setMunicipio} disabled={!departamento}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{departamento && provincia && geoData.municipalities[`${provincia}-${departamento}`]?.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                    </Select>
                   </div>
                 </>
             ) : (
                <div className="space-y-2">
                    <Label>Provincia</Label>
                    <Input value={provincia} onChange={(e) => setProvincia(e.target.value)} />
                </div>
             )}
            <Button onClick={handleSaveLocationData} disabled={isUpdatingProject} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 mt-4">
              <Save className="h-5 w-5" /> {isUpdatingProject ? "Guardando..." : "Guardar Ubicación"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* CARD 3: AÑO DE INICIO DE CAMPAÑAS (Corregida: Botón siempre visible) */}
      <Card className="border-border/50 shadow-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-accent" />
            <CardTitle className="text-foreground">Año de Inicio de Campañas</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="año-inicio">Año de Inicio</Label>
            <Select 
                value={añoInicio.toString()} 
                onValueChange={(value) => setAñoInicio(parseInt(value))} 
                disabled={isTrialMode() || isUpdatingHistory}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un año" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: (initialYear || new Date().getFullYear()) - 1990 + 1 }, (_, i) => 1990 + i).map((year) => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <p className="text-sm text-muted-foreground">
                {isTrialMode() 
                    ? "No puedes cambiar el año de inicio en modo prueba."
                    : <>Año actual de inicio: <strong>{currentStartYear}</strong>. Selecciona un año anterior para extender el historial.</>
                }
            </p>
          </div>

          {/* El botón ahora siempre se renderiza, pero se deshabilita si no hay cambios */}
           <AlertDialog>
              <AlertDialogTrigger asChild>
                  <div className="inline-block"> {/* Wrapper necesario para tooltips/triggers en botones disabled */}
                    <Button 
                        disabled={isTrialMode() || añoInicio >= currentStartYear || isUpdatingHistory}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 w-full sm:w-auto"
                    >
                        {isUpdatingHistory ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        {isUpdatingHistory ? "Generando..." : "Guardar y extender historial"}
                    </Button>
                  </div>
              </AlertDialogTrigger>
              <AlertDialogContent>
                  <AlertDialogHeader>
                      <AlertDialogTitle>¿Confirmar extensión de historial?</AlertDialogTitle>
                      <AlertDialogDescription className="space-y-2">
                          <p>
                              Estás a punto de generar <strong>{campaignsToCreateCount} campañas nuevas</strong>.
                          </p>
                          <p>
                              Esto cubrirá el periodo desde la campaña <strong>{añoInicio}</strong> hasta la <strong>{currentStartYear - 1}</strong>.
                          </p>
                          <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                              Nota: Las campañas se crearán con estado "Cerrado" para mantener el orden histórico.
                          </p>
                      </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction 
                          onClick={handleUpdateInitialYear}
                          className="bg-primary hover:bg-primary/90"
                      >
                          Confirmar
                      </AlertDialogAction>
                  </AlertDialogFooter>
              </AlertDialogContent>
           </AlertDialog>
        </CardContent>
      </Card>

      {/* CARD 4: ELIMINAR PROYECTO */}
      <Card className="border-destructive/50 shadow-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            <CardTitle className="text-foreground">Eliminar Proyecto</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Esta acción eliminará permanentemente el proyecto actual y todos sus datos asociados.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="gap-2">
                  <Trash2 className="h-4 w-4" /> Eliminar Proyecto
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción eliminará permanentemente el proyecto "{projects.find(p => p.id === currentProjectId)?.project_name}" y todos sus datos. No se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteProject} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                    {isDeleting ? "Eliminando..." : "Eliminar"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* CARD ADMIN - Restored Database icon usage */}
      {userRoles.includes('administrator') && (
        <Card className="border-border/50 shadow-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-accent" /> {/* CORRECCIÓN: Ícono restaurado */}
              <CardTitle className="text-foreground">Operaciones de Base de Datos</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Migra los datos de producción almacenados en JSON en la tabla campaigns a la nueva tabla productions.
              </p>
              <Button onClick={handleMigrateProduction} disabled={isMigrating} variant="outline" className="gap-2">
                {isMigrating ? "Migrando..." : "Migrar Datos de Producción"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Config;