import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Alert from '@mui/material/Alert';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';
import { User, ImageItem, CreateUserPayload } from '../types';
import { fetchUserImages, uploadImage, deleteImage } from '../services/image';
import { fetchUsers, registerUser, deactivateUser } from '../services/admin';

interface DashboardPageProps {
  token: string;
  user: User | null;
  onLogout: () => void;
}

export default function DashboardPage({ token, user, onLogout }: DashboardPageProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [captureLoading, setCaptureLoading] = useState(false);
  const [newUser, setNewUser] = useState<CreateUserPayload>({ email: '', password: '', role: 'User' });
  const [adminSuccess, setAdminSuccess] = useState('');

  const isAdmin = user?.role === 'Admin';

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      try {
        const [imagesResponse, usersResponse] = await Promise.all([fetchUserImages(), isAdmin ? fetchUsers() : Promise.resolve([])]);
        setImages(imagesResponse);
        setUsers(usersResponse);
      } catch (err: any) {
        setError(err?.response?.data?.message ?? 'Unable to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [isAdmin]);

  useEffect(() => {
    const startCamera = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setCameraReady(true);
        }
      } catch {
        setCameraReady(false);
      }
    };

    startCamera();

    return () => {
      if (videoRef.current?.srcObject instanceof MediaStream) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleUploadFile = async (file: File) => {
    setError('');
    setCaptureLoading(true);
    try {
      const uploaded = await uploadImage(file);
      setImages((prev) => [uploaded, ...prev]);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to upload image.');
    } finally {
      setCaptureLoading(false);
    }
  };

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current) {
      return;
    }

    setError('');
    setCaptureLoading(true);
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Unable to render camera capture.');
      }
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg'));
      if (!blob) {
        throw new Error('Unable to capture image.');
      }
      const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
      await handleUploadFile(file);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to capture photo.');
    } finally {
      setCaptureLoading(false);
    }
  };

  const handleImageDelete = async (imageId: number) => {
    setError('');
    try {
      await deleteImage(imageId);
      setImages((prev) => prev.filter((item) => item.id !== imageId));
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Unable to delete image.');
    }
  };

  const handleCreateUser = async () => {
    setError('');
    setAdminSuccess('');
    try {
      const created = await registerUser(newUser);
      setUsers((prev) => [created, ...prev]);
      setAdminSuccess('User created successfully.');
      setNewUser({ email: '', password: '', role: 'User' });
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Unable to create user.');
    }
  };

  const handleDeactivate = async (id: number) => {
    setError('');
    try {
      await deactivateUser(id);
      setUsers((prev) => prev.map((item) => (item.id === id ? { ...item, active: false } : item)));
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Unable to deactivate user.');
    }
  };

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <IconButton size="large" edge="start" color="inherit" aria-label="menu" sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Robro System Dashboard
          </Typography>
          <Button color="inherit" onClick={onLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      <Container sx={{ mt: 4, mb: 6 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
              <Typography variant="h5" gutterBottom>
                Welcome, {user?.email}
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Role: {user?.role}
              </Typography>
              {error && <Alert severity="error">{error}</Alert>}
              {loading && <CircularProgress sx={{ mt: 2 }} />}
              <Stack spacing={2} sx={{ mt: 2 }}>
                <Typography variant="subtitle1">Capture or upload image</Typography>
                <Box>
                  <video ref={videoRef} width="100%" style={{ borderRadius: 8, background: '#000' }} />
                  <canvas ref={canvasRef} hidden />
                </Box>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Button variant="contained" onClick={handleCapture} disabled={!cameraReady || captureLoading}>
                    {captureLoading ? 'Capturing...' : 'Capture Photo'}
                  </Button>
                  <Button component="label" variant="outlined" disabled={captureLoading}>
                    Upload Image
                    <input
                      hidden
                      accept="image/*"
                      type="file"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                          handleUploadFile(file);
                        }
                      }}
                    />
                  </Button>
                </Stack>
                {!cameraReady && (
                  <Alert severity="info">
                    Camera is not available or permission was denied. You can still upload an image file.
                  </Alert>
                )}
              </Stack>
            </Paper>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                My Images
              </Typography>
              <Grid container spacing={2}>
                {images.length === 0 && !loading ? (
                  <Grid item xs={12}>
                    <Typography>No images uploaded yet.</Typography>
                  </Grid>
                ) : (
                  images.map((image) => (
                    <Grid key={image.id} item xs={12} sm={6} md={4}>
                      <Card>
                        <CardMedia component="img" height="180" image={`http://localhost:5000/${image.filename}`} alt={image.filename} />
                        <CardContent>
                          <Typography variant="body2">Uploaded on {new Date(image.createdAt).toLocaleString()}</Typography>
                        </CardContent>
                        <CardActions>
                          <Button size="small" color="error" onClick={() => handleImageDelete(image.id)}>
                            Delete
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))
                )}
              </Grid>
            </Paper>
          </Grid>
          {isAdmin && (
            <Grid item xs={12} md={4}>
              <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Admin User Management
                </Typography>
                {adminSuccess && <Alert severity="success">{adminSuccess}</Alert>}
                <TextField
                  fullWidth
                  label="Email"
                  value={newUser.email}
                  onChange={(e) => setNewUser((prev) => ({ ...prev, email: e.target.value }))}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  type="password"
                  label="Password"
                  value={newUser.password}
                  onChange={(e) => setNewUser((prev) => ({ ...prev, password: e.target.value }))}
                  sx={{ mb: 2 }}
                />
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel id="role-label">Role</InputLabel>
                  <Select
                    labelId="role-label"
                    value={newUser.role}
                    label="Role"
                    onChange={(e) => setNewUser((prev) => ({ ...prev, role: e.target.value }))}
                  >
                    <MenuItem value="User">User</MenuItem>
                    <MenuItem value="Admin">Admin</MenuItem>
                  </Select>
                </FormControl>
                <Button variant="contained" fullWidth onClick={handleCreateUser}>
                  Create User
                </Button>
              </Paper>
              <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  User Directory
                </Typography>
                <Stack spacing={1}>
                  {users.map((item) => (
                    <Paper key={item.id} sx={{ p: 1 }}>
                      <Grid container alignItems="center" spacing={1}>
                        <Grid item xs>
                          <Typography variant="subtitle2">{item.email}</Typography>
                          <Typography variant="body2">{item.role} • {item.active ? 'Active' : 'Inactive'}</Typography>
                        </Grid>
                        <Grid item>
                          <Button size="small" color="error" disabled={!item.active} onClick={() => handleDeactivate(item.id)}>
                            Deactivate
                          </Button>
                        </Grid>
                      </Grid>
                    </Paper>
                  ))}
                </Stack>
              </Paper>
            </Grid>
          )}
        </Grid>
      </Container>
    </Box>
  );
}
