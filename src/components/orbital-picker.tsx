"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { getDayOfYear, getDateFromDayOfYear, getDaysInYear } from '@/lib/date-utils';

interface OrbitalPickerProps {
  date: Date;
  onDateChange: (date: Date) => void;
  className?: string;
}

const ORBIT_RX = 200;
const ORBIT_RY = 120;
const SUN_RADIUS = 20;
const EARTH_RADIUS = 10;
const VIEWBOX_WIDTH = (ORBIT_RX + EARTH_RADIUS) * 2 + 40;
const VIEWBOX_HEIGHT = (ORBIT_RY + EARTH_RADIUS) * 2 + 40;

export function OrbitalPicker({ date, onDateChange, className }: OrbitalPickerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartAngle = useRef<number | null>(null);
  const dragStartDate = useRef<Date | null>(null);

  const year = date.getFullYear();
  const daysInYear = useMemo(() => getDaysInYear(year), [year]);

  const dayOfYear = getDayOfYear(date);
  const angle = ((dayOfYear - 1) / daysInYear) * 360;

  const handleInteraction = (e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>) => {
    e.preventDefault();
    if (!svgRef.current || dragStartAngle.current === null || !dragStartDate.current) return;

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

    let angleDiff = currentAngle - dragStartAngle.current;
    
    // Check for crossover (e.g., from 359 to 1 degree)
    if (Math.abs(angleDiff) > 180) {
      if (angleDiff > 0) {
        angleDiff -= 360;
      } else {
        angleDiff += 360;
      }
    }
    dragStartAngle.current = currentAngle;

    const daysDiff = (angleDiff / 360) * getDaysInYear(dragStartDate.current.getFullYear());
    const newDate = new Date(dragStartDate.current.getTime());
    newDate.setDate(newDate.getDate() + daysDiff);

    dragStartDate.current = newDate;

    if (newDate.getTime() !== date.getTime()) {
      onDateChange(newDate);
    }
  };
  
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    setIsDragging(true);
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = e.clientX - centerX;
    const deltaY = e.clientY - centerY;
    let startAngle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
    if (startAngle < 0) startAngle += 360;
    dragStartAngle.current = startAngle;
    dragStartDate.current = new Date(date);
  };
  
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isDragging) {
      handleInteraction(e);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    dragStartAngle.current = null;
    dragStartDate.current = null;
  };

  const handleTouchStart = (e: React.TouchEvent<SVGSVGElement>) => {
    setIsDragging(true);
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = e.touches[0].clientX - centerX;
    const deltaY = e.touches[0].clientY - centerY;
    let startAngle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
    if (startAngle < 0) startAngle += 360;
    dragStartAngle.current = startAngle;
    dragStartDate.current = new Date(date);
  };

  const handleTouchMove = (e: React.TouchEvent<SVGSVGElement>) => {
    if (isDragging) {
      handleInteraction(e);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    dragStartAngle.current = null;
    dragStartDate.current = null;
  };

  useEffect(() => {
    const endDrag = () => {
        if (isDragging) {
            handleMouseUp();
        }
    };
    window.addEventListener('mouseup', endDrag);
    window.addEventListener('touchend', endDrag);
    return () => {
      window.removeEventListener('mouseup', endDrag);
      window.removeEventListener('touchend', endDrag);
    };
  }, [isDragging]);
  
  const earthX = VIEWBOX_WIDTH / 2 + ORBIT_RX * Math.cos(angle * Math.PI / 180);
  const earthY = VIEWBOX_HEIGHT / 2 + ORBIT_RY * Math.sin(angle * Math.PI / 180);

  return (
    <div className={cn('flex justify-center items-center', isDragging ? 'cursor-grabbing' : 'cursor-grab', className)}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        className="w-full max-w-md"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        <defs>
          <filter id="sun-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="10" result="coloredBlur" />
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
          strokeWidth="1"
          strokeDasharray="4 4"
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
            strokeWidth="1.5"
            className="transition-transform duration-75 ease-linear group-hover:scale-110"
          />
        </g>
      </svg>
    </div>
  );
}
