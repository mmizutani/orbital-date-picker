"use client";

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { getDayOfYear, getDaysInYear, getDateFromDayOfYear } from '@/lib/date-utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';

interface OrbitalPickerProps {
  date: Date;
  onDateChange: (date: Date) => void;
  className?: string;
}

const ORBIT_RX = 200;
const ORBIT_RY = 120;
const SUN_RADIUS = 30;
const EARTH_RADIUS = 15;
const VIEWBOX_WIDTH = (ORBIT_RX + EARTH_RADIUS) * 2 + 40;
const VIEWBOX_HEIGHT = (ORBIT_RY + EARTH_RADIUS) * 2 + 40;

export function OrbitalPicker({ date, onDateChange, className }: OrbitalPickerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const dragStartInfo = useRef<{ angle: number; startDayOfYear: number; startYear: number; totalAngle: number } | null>(null);

  const year = date.getFullYear();
  const daysInYear = getDaysInYear(year);
  const dayOfYear = getDayOfYear(date);

  const angle = ((dayOfYear - 1) / daysInYear) * 360;

  const handleInteraction = (e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>) => {
    e.preventDefault();
    if (!svgRef.current) return;

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

    if (!dragStartInfo.current) return;

    let angleDiff = currentAngle - dragStartInfo.current.angle;
    
    if (angleDiff > 180) angleDiff -= 360;
    if (angleDiff < -180) angleDiff += 360;

    const newTotalAngle = dragStartInfo.current.totalAngle + angleDiff;
    dragStartInfo.current.totalAngle = newTotalAngle;
    dragStartInfo.current.angle = currentAngle;

    const daysInStartYear = getDaysInYear(dragStartInfo.current.startYear);
    const dayOffset = (newTotalAngle / 360) * daysInStartYear;
    
    let newDayOfYear = dragStartInfo.current.startDayOfYear + dayOffset;
    
    let newYear = dragStartInfo.current.startYear;
    
    while (newDayOfYear > getDaysInYear(newYear)) {
      newDayOfYear -= getDaysInYear(newYear);
      newYear++;
    }
    while (newDayOfYear <= 0) {
      newYear--;
      newDayOfYear += getDaysInYear(newYear);
    }
    
    const newDate = getDateFromDayOfYear(Math.round(newDayOfYear), newYear);

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

    dragStartInfo.current = { 
      angle: startAngle, 
      startDayOfYear: currentDayOfYear,
      startYear: date.getFullYear(),
      totalAngle: 0,
    };
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
      dragStartInfo.current = null;
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
  }, [isDragging]);
  
  const earthX = VIEWBOX_WIDTH / 2 + ORBIT_RX * Math.cos(angle * Math.PI / 180);
  const earthY = VIEWBOX_HEIGHT / 2 + ORBIT_RY * Math.sin(angle * Math.PI / 180);
  
  const earthImage = PlaceHolderImages.find(img => img.id === 'earth');

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
          strokeWidth="2.5"
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
          {earthImage && (
             <image
              href={earthImage.imageUrl}
              x={-EARTH_RADIUS}
              y={-EARTH_RADIUS}
              height={EARTH_RADIUS * 2}
              width={EARTH_RADIUS * 2}
              className="transition-transform duration-75 ease-linear group-hover:scale-110"
            />
          )}
        </g>
      </svg>
    </div>
  );
}
