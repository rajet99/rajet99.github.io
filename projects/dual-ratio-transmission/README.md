# Dual-Ratio Passive Shifting Transmission

A mechanical powertrain project focused on designing and fabricating a two-speed transmission for a bicycle wheel capable of shifting gear ratios automatically without electronic actuators or complex microcontroller supervision. The system leverages one-way roller clutches to shift between a 9:1 high-torque ratio and a 4:1 high-speed ratio simply by reversing the direction of the input motor. This was developed as part of the Transmission Design Competition for ME14 (Design and Fabrication) at Caltech, and our team of 6 ended up winning the competition, setting a new record.

## Demonstration

[Watch the transmission demonstration on YouTube](https://youtu.be/QBFlbIeEo6Q)

## Mechanical Principles & Architecture

Standard multi-speed transmissions rely on solenoid actuators or active clutches to switch gears. This design eliminates active shifting components by integrating one-way roller clutches into the parallel gear trains. A roller clutch uses spring-loaded rollers between an inner and outer race. The rollers wedge between the races when torque is applied in the locking direction, transmitting power; in the opposite direction, they release and allow the shaft to overrun, acting like a bearing. Each gear train therefore transmits torque in only one motor direction while the other train freewheels with minimal frictional loss.

When the input motor spins in the forward direction, the high-torque (9:1) roller clutch locks and drives the output while the high-speed gear train freewheels. To shift, a double-pole double-throw (DPDT) switch reverses the motor polarity. The 9:1 clutch then overruns, while the high-speed (4:1) clutch locks and drives the output. Reversing the motor direction therefore selects the active gear train mechanically, without an electronic actuator.

## Design & Analysis Highlights

* **Gear-Belt Solver Optimization:** Driving parallel gear and timing belt stages from the same fixed shafts requires exact center-to-center distances to prevent binding or slack. A custom solver was developed to evaluate all possible gear and pulley tooth combinations, identifying a configuration that utilized a 41T GT3 3mm belt with a center distance of 42.127mm, resulting in a negligible 0.0116mm of belt slack without requiring a tensioner.
* **Keyless Press-Fit Assembly:** To simplify fabrication and avoid the significant machining required for keyed shafts, the design uses interference press-fits and set screws. Lam� equations were utilized to calculate the necessary interference, proving the press-fits could survive tangential and radial loads with a safety factor of 13, and friction torque with a safety factor of 2.
* **Material Selection and MOI Reduction:** Reducing the moment of inertia was a primary design goal to minimize power losses. The gear train utilized lightweight acetal gears rather than broass, and we went with thin 1/4" steel shafts. To ensure structural integrity under the high-speed tangential loading, the width of the 25-tooth acetal gear was doubled, yielding a safety factor of 2.02 against shear failure (calculated via the Lewis equation).
* **FEA Structural Validation:** Finite element stress analysis was conducted on the high-torque output shaft under combined loading. The maximum von Mises stress reached 13.7 MPa even with a keyed shaft configuration, well within the material limits. The torsional deformation was also determined to be significantly lower than the gear's circular pitch, meaning it would not cause gear tooth misalignment during testing.
