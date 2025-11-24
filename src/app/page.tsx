"use client";

import { useState } from 'react';
import { OrbitalPicker } from '@/components/orbital-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { CalendarDays } from 'lucide-react';

export default function Home() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { toast } = useToast();

  const handleSubmit = () => {
    toast({
      title: "Date Submitted!",
      description: `You have selected: ${format(selectedDate, "PPP")}`,
    });
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 md:p-24 bg-background">
      <div className="w-full max-w-2xl mx-auto">
        <Card className="bg-card/50 backdrop-blur-sm border-border/20 shadow-2xl shadow-primary/5">
          <CardHeader className="items-center text-center pb-2">
            <CardTitle className="text-3xl font-headline tracking-tight text-foreground">
              Orbital Date Picker
            </CardTitle>
            <CardDescription className="text-base">Drag the Earth to select a date.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center gap-8">
            <OrbitalPicker date={selectedDate} onDateChange={setSelectedDate} />
            <div className="text-center">
              <p className="text-lg text-muted-foreground">Selected Date</p>
              <p className="text-3xl font-bold text-foreground tabular-nums tracking-tight">
                {format(selectedDate, 'MMMM d, yyyy')}
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button size="lg" onClick={handleSubmit}>
              <CalendarDays className="mr-2 h-5 w-5" />
              Submit Date
            </Button>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
