import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const components = [
  {
    title: "Db URL Builder",
    href: "/pgurlbuilder",
    description: "Generate and validate a database URL or ConnectionString",
  },
  {
    title: "Dev Db Builder",
    href: "/scripts",
    description:
      "Generate scripts that will create a new application database and user. Setup permissions for new user.",
  },
  {
    title: "Certificates",
    href: "/cert-renew",
    description: "Generate or renew LE certificates.",
  },
];

export function Dashboard() {
  return (
    <div className="min-h-screen px-4 py-10">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center">Dashboard</h1>
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {components.map((component) => (
            <Card key={component.href} className="flex flex-col justify-between">
              <CardHeader>
                <CardTitle>{component.title}</CardTitle>
                <CardDescription>{component.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link to={component.href}>
                    Go <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
