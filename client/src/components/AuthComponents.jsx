import { useActionState } from "react";
import { Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { Link } from 'react-router';
function LoginForm(props) {
    const initialState = { error: null, success: false };
    const [state, formAction, isPending] = useActionState(loginFunction, initialState);
    async function loginFunction(prevState, formData) {
        const credentials = {
            username: formData.get('username'),
            password: formData.get('password'),
        };

        try {
            await props.handleLogin(credentials);
            return {  error: null, success: true };
        } catch (error) {
            return { error: 'Login failed. Check your credentials.', success: false };
        }
    }

    return (
        <>
            {state.error && <Row>
                <Alert variant="danger" onClose={() => state.error=''} dismissible>{state.error}</Alert>
            </Row>}
            { isPending && <Alert variant="warning">Please, wait for the server's response...</Alert> }
            <Row className="justify-content-center">
                <Col md={6}>
                    <Form action={formAction}>
                        <Form.Group controlId='username' className='mb-3'>
                            <Form.Label>Username</Form.Label>
                            <Form.Control type='text' name='username' required />
                        </Form.Group>

                        <Form.Group controlId='password' className='mb-3'>
                            <Form.Label>Password</Form.Label>
                            <Form.Control type='password' name='password' required minLength={6} />
                        </Form.Group>
                        <Button type='submit' disabled={isPending}>Login</Button>
                        <Link className='btn btn-danger mx-2 my-2' to={'/'} disabled={isPending}>Cancel</Link>
                    </Form>
                </Col>
            </Row>
        </>
    );
}

function LogoutButton(props) {
  return <Button variant='outline-light' onClick={props.logout}>Logout</Button>;
}

export { LoginForm, LogoutButton };