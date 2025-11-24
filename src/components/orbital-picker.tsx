"use client";

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { getDayOfYear, getDaysInYear, getDateFromDayOfYear } from '@/lib/date-utils';

interface OrbitalPickerProps {
  date: Date;
  onDateChange: (date: Date) => void;
  className?: string;
}

const ORBIT_RX = 320;
const ORBIT_RY = 210;
const SUN_RADIUS = 60;
const EARTH_RADIUS = 30;
const VIEWBOX_WIDTH = (ORBIT_RX + EARTH_RADIUS) * 2 + 40;
const VIEWBOX_HEIGHT = (ORBIT_RY + EARTH_RADIUS) * 2 + 40;

export function OrbitalPicker({ date, onDateChange, className }: OrbitalPickerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const dragStartInfo = useRef<{ angle: number; time: number, startDayOfYear: number, startYear: number } | null>(null);

  const year = date.getFullYear();
  const daysInYear = getDaysInYear(year);
  const dayOfYear = getDayOfYear(date);

  const angle = ((dayOfYear - 1) / daysInYear) * 360;

  const handleInteraction = (e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>) => {
    e.preventDefault();
    if (!svgRef.current || !dragStartInfo.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;
    
    let currentAngle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
    if (currentAngle < 0) {
      currentAngle += 360;
    }

    let angleDiff = currentAngle - dragStartInfo.current.angle;
    
    // Normalize angle difference to handle wrapping around 360 degrees
    if (angleDiff > 180) angleDiff -= 360;
    if (angleDiff < -180) angleDiff += 360;

    const totalAngleDiff = (dragStartInfo.current.angle + angleDiff) - dragStartInfo.current.angle;
    
    const daysInStartYear = getDaysInYear(dragStartInfo.current.startYear);
    const dayOffset = (angleDiff / 360) * daysInStartYear;
    
    const newDayOfYear = dragStartInfo.current.startDayOfYear + dayOffset;
    
    let newYear = dragStartInfo.current.startYear;
    let finalDayOfYear = newDayOfYear;
    
    const daysInCurrentNewYear = getDaysInYear(newYear);

    if (finalDayOfYear > daysInCurrentNewYear) {
      finalDayOfYear -= daysInCurrentNewYear;
      newYear++;
    } else if (finalDayOfYear <= 0) {
      const daysInPreviousYear = getDaysInYear(newYear - 1);
      finalDayOfYear += daysInPreviousYear;
      newYear--;
    }

    const newDate = getDateFromDayOfYear(Math.round(finalDayOfYear), newYear);

    if (newDate.getTime() !== date.getTime()) {
      onDateChange(newDate);
    }
  };
  
  const startDragging = (clientX: number, clientY: number) => {
    setIsDragging(true);
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;
    let startAngle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
    if (startAngle < 0) startAngle += 360;
    
    const currentDayOfYear = getDayOfYear(date);
    dragStartInfo.current = { angle: startAngle, time: date.getTime(), startDayOfYear: currentDayOfYear, startYear: date.getFullYear() };
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    startDragging(e.clientX, e.clientY);
  };
  
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isDragging) {
      handleInteraction(e);
    }
  };

  const stopDragging = () => {
    if (isDragging) {
      setIsDragging(false);
      
      if(dragStartInfo.current) {
        const currentDayOfYear = getDayOfYear(date);
        dragStartInfo.current.startDayOfYear = currentDayOfYear;
        dragStartInfo.current.startYear = date.getFullYear();
      }
    }
  };

  const handleTouchStart = (e: React.TouchEvent<SVGSVGElement>) => {
    startDragging(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent<SVGSVGElement>) => {
    if (isDragging) {
      handleInteraction(e);
    }
  };

  useEffect(() => {
    const handleMouseUp = () => stopDragging();
    const handleTouchEnd = () => stopDragging();
    
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);
    
    const handleMouseLeave = (e: MouseEvent) => {
        if (isDragging && !e.relatedTarget) {
            stopDragging();
        }
    };
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isDragging, date]);
  
  const earthX = VIEWBOX_WIDTH / 2 + ORBIT_RX * Math.cos(angle * Math.PI / 180);
  const earthY = VIEWBOX_HEIGHT / 2 + ORBIT_RY * Math.sin(angle * Math.PI / 180);

  return (
    <div className={cn('flex justify-center items-center', isDragging ? 'cursor-grabbing' : 'cursor-grab', className)}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        className="w-full max-w-lg"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        <defs>
          <filter id="sun-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="15" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <ellipse
          cx={VIEWBOX_WIDTH / 2}
          cy={VIEWBOX_HEIGHT / 2}
          rx={ORBIT_RX}
          ry={ORBIT_RY}
          stroke="hsl(var(--muted-foreground))"
          strokeWidth="1.5"
          strokeDasharray="5 5"
          fill="none"
        />

        <circle
          cx={VIEWBOX_WIDTH / 2}
          cy={VIEWBOX_HEIGHT / 2}
          r={SUN_RADIUS}
          fill="hsl(var(--accent))"
          filter="url(#sun-glow)"
        />

        <g transform={`translate(${earthX}, ${earthY})`}>
           <circle
            r={EARTH_RADIUS * 1.5}
            fill="transparent"
          />
          <circle
            r={EARTH_RADIUS}
            fill="#6b93d6"
            stroke="#fff"
            strokeWidth="2"
            className="transition-transform duration-75 ease-linear group-hover:scale-110"
          />
        </g>
      </svg>
    </div>
  );
}
