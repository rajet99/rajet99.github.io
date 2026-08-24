# Object Tracking Webcam System

A real-time vision-based tracking system that combines computer vision, closed-loop positional control, and stepper motor actuation to autonomously track colored racquetballs. The system processes live webcam frames, estimates the target's position relative to the camera, and generates smooth motor trajectories to continuously center the target. Developed with a parter as part of ME8, an introductory Caltech robotics lab course.

## Overview
The robot uses a webcam as its primary sensor alongside stepper motors to control the camera and tracking platform. The entire system operates as a closed-loop pipeline with the following sequence:

**Camera Input → Image Segmentation → Object Detection → Centroid Estimation → Positional Error → Motor Control**

In order to maximize efficiency, the software architecture separates the system into three concurrent stages:

* **Image Acquisition:** Continuously captures frames from the webcam.
* **Vision Processing:** Segments target objects and estimates their position using geometric features.
* **Motor Control:** Converts the estimated image-space error into smooth stepper motor trajectories.

This parallel task separation allows the robot to continue acquiring and processing new visual information at the exact same time that motor commands are being executed.

## Demonstrations

<div class="project-demo-videos">
    <p><a href="https://youtube.com/shorts/2UmPfR1mL_Y">Watch demonstration video 1</a></p>
    <p><a href="https://youtube.com/shorts/gNEnLHN7Rmc">Watch demonstration video 2</a></p>
</div>

## Object Detection
Each camera frame is processed using OpenCV to isolate objects based on color. During this process, the image is converted into a binary mask, in which pixels within the target color range are retained while the remaining image is heavily suppressed. Erosion and dilation are applied to denoise the mask before object detection.

The filtered mask is then analyzed to extract candidate objects, based on the following criteria:

* **Color:** Candidate pixels must fall within the target color range.
* **Size:** Small regions and isolated noise are immediately discarded.
* **Aspect Ratio:** Candidates with strongly non-circular bounding boxes are rejected.
* **Circularity:** Candidate contours are compared against an equivalent circular geometry (see circular centroid estimation) to identify objects that more closely match the expected target shape.

This combination of color and geometric filtering makes the detector much more robust for racquetball detection than on pure color segmentation alone.

## Centroid Estimation
After successfully identifying a target contour, the system proceeds to estimate its center in image space. There are several approaches that can be used to accomplish this, heavily depending on the geometry and segmentation quality:

* **Area Center:** Computes the average of all segmented pixel coordinates.
* **Bounding Box Center:** Uses the center of the contour's axis-aligned bounding box.
* **Circular Center:** Fits or estimates a circle around the detected object and uses its center.
* **Elliptical Center:** Fits an ellipse to the contour and uses its geometric center.

For this system, the circular center method was selected due to having spherical tracking targets. This method provides a center estimate that is far less sensitive to small irregularities in the segmented contour than directly averaging individual pixels or merely taking the cartesian bounds of the detected object. While elliptical centers may seem better on paper, lighting conditions often caused parts of the ball to be obscured from tracking, leading to irregular shapes that may be misinterpreted as ellipses highly offset from the true object center. The estimated center is then compared against the center of the camera's field of view to determine the target's relative positional error.

## Closed-Loop Tracking
The center of the camera effectively serves as the desired target position. When the detected object moves away from this central point, the resulting image-space error is immediately converted into motor commands that rotate the camera and tracking platform directly toward the target. 

The control loop therefore follows a continuous cycle:

**Target Motion → Image Displacement → Position Error → Motor Command → Camera Motion → Updated Image**

Because the system continuously recomputes the target position from new camera frames, the robot is able to respond dynamically as the target moves rather than relying on a predetermined rigid motion path. 

## Trajectory Generation
Directly translating each detected position into an instantaneous motor command can often produce abrupt motion and severe oscillation. This is especially noticeable when the detected centroid shifts slightly between consecutive frames due to segmentation noise or small variations in the object's apparent shape.

Motor commands are passed through spline interpolation to generate smooth trajectories between successive target positions, reducing jitter caused by noisy centroid estimates.

For two successive target positions, a cubic  spline can be used to interpolate the commanded position, velocity, and acceleration continuously:

$$
\begin{aligned}
\mathbf{p}(t) ={}& (2t^3 - 3t^2 + 1)\mathbf{p}_0 \\
                  &+ (t^3 - 2t^2 + t)\mathbf{v}_0 \\
                  &+ (-2t^3 + 3t^2)\mathbf{p}_1 \\
                  &+ (t^3 - t^2)\mathbf{v}_1,
\qquad 0 \leq t \leq 1
\end{aligned}
$$

Here, $\mathbf{p}_0$ and $\mathbf{p}_1$ are the initial and final positions, $\mathbf{v}_0$ and $\mathbf{v}_1$ are endpoint velocities, and $t$ ranges from $0$ to $1$ over the trajectory. 

## Multithreading
Image acquisition, vision processing, and motor control are all implemented as concurrent processes within a multithreaded software architecture. 

Specifically, the camera thread continuously acquires the latest frame while the vision-processing thread performs segmentation and object localization. At the same time, the motor-control thread independently consumes the latest positional error and generates the corresponding motor trajectory. This effectively prevents image processing or motor execution from unnecessarily blocking camera acquisition, thus allowing the system to maintain continuous visual feedback during motor movement.

## Mechanical Hardware
Custom 3D-printed L-brackets were fabricated to properly mount the stepper motors and webcam to the tracking assembly. These mounts provide rigid alignment between the camera and the motorized axes while keeping the overall mechanism highly compact and efficient.