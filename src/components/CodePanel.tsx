import React from 'react';
import { Code, Layers } from 'lucide-react';
import BoltBadge from './BoltBadge';

interface CodePanelProps {
  onPeelAway: () => void;
  isVisible: boolean;
}

const terraformCode = `
resource "aws_instance" "web_server" {
  ami           = "ami-0c55b159cbfafe1d0"
  instance_type = "t3.medium"
  key_name      = "my-key-pair"
  
  vpc_security_group_ids = [aws_security_group.web.id]
  subnet_id              = aws_subnet.public.id
  
  tags = {
    Name        = "WebServer"
    Environment = "production"
    Project     = "infra-demo"
  }
}

resource "aws_security_group" "web" {
  name        = "web-sg"
  description = "Security group for web server"
  vpc_id      = aws_vpc.main.id
  
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}`;

export default function CodePanel({ onPeelAway, isVisible }: CodePanelProps) {
  return (
    <div
      className={`fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 z-20 transition-transform duration-1000 ease-in-out ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <BoltBadge />
      <div className="h-full flex flex-col items-center justify-center p-8">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Code className="w-8 h-8 text-blue-400" />
              <h1 className="text-3xl font-bold text-white">Infrastructure as Code</h1>
            </div>
            <p className="text-slate-300 text-lg leading-relaxed max-w-2xl mx-auto">
              This is how most infrastructure is defined—dry, text-only, and hard to visualize.
              What if we could see our infrastructure as a living, breathing city?
            </p>
          </div>

          {/* Code Block */}
          <div className="bg-slate-950/80 backdrop-blur-sm rounded-lg border border-slate-700 shadow-2xl mb-8">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="ml-4 text-slate-400 text-sm">main.tf</span>
            </div>
            <pre className="p-6 text-sm leading-relaxed overflow-auto max-h-80">
              <code className="text-slate-200 font-mono whitespace-pre">
                {terraformCode}
              </code>
            </pre>
          </div>

          {/* Peel Away Button */}
          <div className="text-center">
            <button
              onClick={onPeelAway}
              className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl"
            >
              <div className="flex items-center gap-3">
                <Layers className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                Peel Away & Explore in 3D
              </div>
            </button>
            <p className="text-slate-400 text-sm mt-3">
              Discover your infrastructure as an interactive 3D city
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}