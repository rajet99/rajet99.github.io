# Rajat Bidarkota
 
I'm a Mechanical Engineering undergrad at Caltech, concentrating in Systems and Control with an Aerospace minor. I'm interested in guidance, navigation, and control for vehicles and aerospace systems, spanning classical control, learned/adaptive control, and embedded deployment.
 
## Projects

 
### [TVC Rocket](https://github.com/rajet99/tvc-experimentation)
 
A thrust vector control rocket simulation project, with the long-term goal of flying a real rocket. Beyond the single vehicle, the goal is a control system architecture that generalizes across vehicle types without significant per-vehicle reprogramming or physics modeling, unifies guidance and control rather than treating them as separate layers, and eventually learns and improves online from experience.
 
### [Linear Inverted Pendulum](https://github.com/rajet99/inverted-pendulum)
 
A linear inverted pendulum simulation and control project, serving as the foundational modeling and algorithmic testbed for a physical, self-balancing cart-pole system. The project established a robust control base—incorporating energy-based swing-up control, state-feedback LQR, and cascaded PID architectures within MATLAB/Simulink and C++—to simulate full system dynamics before transitioning to physical embedded hardware. Beyond the software modeling, the verified control framework was translated to an ESP32 microcontroller driving a stepper motor along a V-slot linear rail, bridging the gap between theoretical dynamics, state-transition safeguards, and real-time physical stabilization in collaboration with a project team.