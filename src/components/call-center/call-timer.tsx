'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Phone, 
  PhoneOff, 
  Pause, 
  Play, 
  Clock,
  User,
  Volume2,
  VolumeX 
} from 'lucide-react';

interface CallTimerProps {
  isOnCall: boolean;
  callDuration: number;
  callStatus: 'IDLE' | 'INCOMING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED';
  operatorId: string;
  onStartCall: () => void;
  onEndCall: () => void;
  onHoldCall: () => void;
  customerName?: string;
  customerPhone?: string;
}

export function CallTimer({
  isOnCall,
  callDuration,
  callStatus,
  operatorId,
  onStartCall,
  onEndCall,
  onHoldCall,
  customerName,
  customerPhone,
}: CallTimerProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500 text-white';
      case 'ON_HOLD':
        return 'bg-yellow-500 text-white';
      case 'INCOMING':
        return 'bg-blue-500 text-white animate-pulse';
      case 'COMPLETED':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-200 text-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Active Call';
      case 'ON_HOLD':
        return 'On Hold';
      case 'INCOMING':
        return 'Incoming Call';
      case 'COMPLETED':
        return 'Call Ended';
      default:
        return 'Ready';
    }
  };

  return (
    <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-lg">
      <CardContent className="p-4">
        {/* Operator Info */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium">{operatorId}</span>
          </div>
          <div className="text-xs text-gray-500">
            {currentTime.toLocaleTimeString()}
          </div>
        </div>

        {/* Call Status */}
        <div className="text-center mb-4">
          <Badge className={`${getStatusColor(callStatus)} mb-2`}>
            {getStatusText(callStatus)}
          </Badge>
          
          {isOnCall && (
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-lg font-mono font-bold">
                {formatDuration(callDuration)}
              </span>
            </div>
          )}
          
          {customerName && (
            <div className="text-sm">
              <div className="font-medium text-gray-800">{customerName}</div>
              {customerPhone && (
                <div className="text-gray-500">{customerPhone}</div>
              )}
            </div>
          )}
        </div>

        {/* Call Controls */}
        <div className="grid grid-cols-2 gap-2">
          {!isOnCall ? (
            <>
              <Button
                onClick={onStartCall}
                className="bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                <Phone className="w-4 h-4 mr-1" />
                Start Call
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled
              >
                <PhoneOff className="w-4 h-4 mr-1" />
                End Call
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={onHoldCall}
                variant={callStatus === 'ON_HOLD' ? "default" : "outline"}
                size="sm"
                className={callStatus === 'ON_HOLD' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
              >
                {callStatus === 'ON_HOLD' ? (
                  <>
                    <Play className="w-4 h-4 mr-1" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="w-4 h-4 mr-1" />
                    Hold
                  </>
                )}
              </Button>
              <Button
                onClick={onEndCall}
                variant="destructive"
                size="sm"
              >
                <PhoneOff className="w-4 h-4 mr-1" />
                End Call
              </Button>
            </>
          )}
        </div>

        {/* Audio Controls */}
        <div className="mt-3 flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMuted(!isMuted)}
            className="text-gray-500 hover:text-gray-700"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Call Statistics */}
        {callStatus === 'COMPLETED' && (
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center">
              Call Duration: {formatDuration(callDuration)}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 